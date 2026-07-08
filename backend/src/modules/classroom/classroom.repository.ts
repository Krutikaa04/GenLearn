import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Classroom, ClassroomDocument } from './schemas/classroom.schema';

@Injectable()
export class ClassroomRepository {
  constructor(
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
  ) {}

  async create(data: Partial<Classroom>): Promise<ClassroomDocument> {
    return this.classroomModel.create(data);
  }

  async findByClassroomId(classroomId: string): Promise<ClassroomDocument | null> {
    return this.classroomModel.findOne({ classroomId, deletedAt: null }).exec();
  }

  async findByTeacher(teacherId: string): Promise<ClassroomDocument[]> {
    return this.classroomModel
      .find({ teacherId, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByJoinCode(joinCode: string): Promise<ClassroomDocument | null> {
    return this.classroomModel.findOne({ joinCode, deletedAt: null }).exec();
  }

  async findByMember(studentId: string): Promise<ClassroomDocument[]> {
    return this.classroomModel
      .find({ memberIds: studentId, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }

  async addMember(classroomId: string, studentId: string): Promise<void> {
    await this.classroomModel
      .updateOne({ classroomId }, { $addToSet: { memberIds: studentId } })
      .exec();
  }

  async removeMember(classroomId: string, studentId: string): Promise<void> {
    await this.classroomModel
      .updateOne({ classroomId }, { $pull: { memberIds: studentId } })
      .exec();
  }

  async softDelete(classroomId: string): Promise<void> {
    await this.classroomModel
      .updateOne({ classroomId }, { $set: { deletedAt: new Date() } })
      .exec();
  }
}
