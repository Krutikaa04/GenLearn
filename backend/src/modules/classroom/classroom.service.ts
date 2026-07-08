import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ClassroomRepository } from './classroom.repository';
import { ClassroomDocument } from './schemas/classroom.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { AnalyticsService } from '../analytics/analytics.service';
import { QuizService } from '../quiz/quiz.service';

/** Unambiguous alphabet: no I/O/0/1 so codes survive handwriting and dictation. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_CREATE_ATTEMPTS = 5;

function generateJoinCode(): string {
  const pick = () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  const block = () => Array.from({ length: 4 }, pick).join('');
  return `${block()}-${block()}`;
}

@Injectable()
export class ClassroomService {
  constructor(
    private readonly classroomRepository: ClassroomRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly quizService: QuizService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // ---------- Teacher operations ----------

  async create(teacherId: string, name: string, description?: string) {
    let classroom: ClassroomDocument | null = null;
    for (let attempt = 0; attempt < CODE_CREATE_ATTEMPTS && !classroom; attempt++) {
      try {
        classroom = await this.classroomRepository.create({
          classroomId: uuidv4(),
          teacherId,
          name,
          description: description ?? '',
          joinCode: generateJoinCode(),
        });
      } catch (err) {
        // Unique-index collision on joinCode — regenerate and retry
        if ((err as { code?: number }).code !== 11000 || attempt === CODE_CREATE_ATTEMPTS - 1) throw err;
      }
    }
    return this.serialize(classroom!);
  }

  async listOwn(teacherId: string) {
    const classrooms = await this.classroomRepository.findByTeacher(teacherId);
    return classrooms.map((c) => this.serialize(c));
  }

  async getRoster(teacherId: string, classroomId: string) {
    const classroom = await this.findOwnedClassroom(teacherId, classroomId);
    const members = await this.findMembers(classroom.memberIds);
    return { ...this.serialize(classroom), students: members };
  }

  /** Per-student progress snapshot for every classroom member. */
  async getDashboard(teacherId: string, classroomId: string) {
    const classroom = await this.findOwnedClassroom(teacherId, classroomId);
    const members = await this.findMembers(classroom.memberIds);

    const students = await Promise.all(
      members.map(async (member) => {
        const [progress, weakTopics] = await Promise.all([
          this.analyticsService.getProgress(member.userId),
          this.analyticsService.getWeakTopics(member.userId),
        ]);
        return {
          ...member,
          progress: {
            overallMasteryScore: progress.overallMasteryScore,
            currentStreak: progress.currentStreak,
            totalQuizzesTaken: progress.totalQuizzesTaken,
            xpTotal: progress.xpTotal,
            level: progress.level,
            lastActiveDate: progress.lastActiveDate,
          },
          weakTopics: weakTopics.slice(0, 3),
        };
      }),
    );

    return { classroom: this.serialize(classroom), students };
  }

  /** Full report for one student: progress, weak topics, quiz history with scores. */
  async getStudentReport(teacherId: string, classroomId: string, studentId: string, page = 1, pageSize = 20) {
    const classroom = await this.findOwnedClassroom(teacherId, classroomId);
    if (!classroom.memberIds.includes(studentId)) {
      throw new ForbiddenException({ code: 'NOT_A_MEMBER', message: 'Student is not in this classroom' });
    }

    const [members, progress, weakTopics, quizzes] = await Promise.all([
      this.findMembers([studentId]),
      this.analyticsService.getProgress(studentId),
      this.analyticsService.getWeakTopics(studentId),
      this.quizService.findAll(studentId, page, pageSize),
    ]);

    return { student: members[0] ?? null, progress, weakTopics, quizzes };
  }

  async removeStudent(teacherId: string, classroomId: string, studentId: string): Promise<void> {
    await this.findOwnedClassroom(teacherId, classroomId);
    await this.classroomRepository.removeMember(classroomId, studentId);
  }

  async delete(teacherId: string, classroomId: string): Promise<void> {
    await this.findOwnedClassroom(teacherId, classroomId);
    await this.classroomRepository.softDelete(classroomId);
  }

  // ---------- Student operations ----------

  async join(studentId: string, joinCode: string) {
    // Forgiving input: accept lowercase and a missing dash, store canonical XXXX-XXXX
    const normalized = joinCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const canonical = `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
    const classroom = await this.classroomRepository.findByJoinCode(canonical);
    if (!classroom) {
      throw new NotFoundException({ code: 'INVALID_JOIN_CODE', message: 'No classroom found for this code' });
    }
    await this.classroomRepository.addMember(classroom.classroomId, studentId);
    return { classroomId: classroom.classroomId, name: classroom.name };
  }

  async listJoined(studentId: string) {
    const classrooms = await this.classroomRepository.findByMember(studentId);
    const teacherIds = [...new Set(classrooms.map((c) => c.teacherId))];
    const teachers = teacherIds.length
      ? await this.userModel
          .find({ userId: { $in: teacherIds } })
          .select('userId firstName lastName')
          .exec()
      : [];
    const teacherById = new Map(teachers.map((t) => [t.userId, `${t.firstName} ${t.lastName}`]));

    return classrooms.map((c) => ({
      classroomId: c.classroomId,
      name: c.name,
      description: c.description,
      teacherName: teacherById.get(c.teacherId) ?? 'Unknown teacher',
    }));
  }

  async leave(studentId: string, classroomId: string): Promise<void> {
    const classroom = await this.classroomRepository.findByClassroomId(classroomId);
    if (!classroom) {
      throw new NotFoundException({ code: 'CLASSROOM_NOT_FOUND', message: 'Classroom not found' });
    }
    await this.classroomRepository.removeMember(classroomId, studentId);
  }

  // ---------- Internals ----------

  private async findOwnedClassroom(teacherId: string, classroomId: string): Promise<ClassroomDocument> {
    const classroom = await this.classroomRepository.findByClassroomId(classroomId);
    if (!classroom) {
      throw new NotFoundException({ code: 'CLASSROOM_NOT_FOUND', message: 'Classroom not found' });
    }
    if (classroom.teacherId !== teacherId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You do not own this classroom' });
    }
    return classroom;
  }

  private async findMembers(memberIds: string[]) {
    if (memberIds.length === 0) return [];
    const users = await this.userModel
      .find({ userId: { $in: memberIds }, deletedAt: null })
      .select('userId email firstName lastName')
      .exec();
    return users.map((u) => ({
      userId: u.userId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
  }

  private serialize(classroom: ClassroomDocument) {
    return {
      classroomId: classroom.classroomId,
      name: classroom.name,
      description: classroom.description,
      joinCode: classroom.joinCode,
      memberCount: classroom.memberIds.length,
      createdAt: (classroom as any).createdAt,
    };
  }
}
