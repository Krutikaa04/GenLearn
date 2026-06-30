import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { QuizRepository } from './quiz.repository';
import { QuizStatus } from './schemas/quiz.schema';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QUIZ_GENERATION_QUEUE, QuizGenerationJob } from './workers/quiz-generator.processor';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly analyticsService: AnalyticsService,
    @InjectQueue(QUIZ_GENERATION_QUEUE) private readonly generationQueue: Queue,
  ) {}

  async generate(studentId: string, dto: GenerateQuizDto) {
    const quizId = uuidv4();

    const quiz = await this.quizRepository.create({
      quizId,
      studentId,
      topic: dto.challengeMode && dto.challengeTopics?.length
        ? dto.challengeTopics.join(', ')
        : dto.topic,
      difficulty: dto.difficulty,
      questionCount: dto.questionCount ?? 10,
      documentIds: dto.documentIds ?? [],
      challengeMode: dto.challengeMode ?? false,
      challengeTopics: dto.challengeTopics ?? [],
      timeLimitMinutes: dto.timeLimitMinutes ?? null,
      status: QuizStatus.PENDING,
    });

    const jobData: QuizGenerationJob = {
      quizId,
      studentId,
      topic: dto.topic,
      difficulty: dto.difficulty,
      questionCount: dto.questionCount ?? 10,
      documentIds: dto.documentIds ?? [],
      challengeMode: dto.challengeMode,
      challengeTopics: dto.challengeTopics,
      timeLimitMinutes: dto.timeLimitMinutes,
    };

    await this.generationQueue.add('generate', jobData, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.logger.log(`Quiz ${quizId} queued for generation`);

    return {
      quizId: quiz.quizId,
      status: quiz.status,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questionCount: quiz.questionCount,
      challengeMode: quiz.challengeMode,
      timeLimitMinutes: quiz.timeLimitMinutes,
      pollUrl: `/api/v1/quizzes/${quizId}/status`,
    };
  }

  async findAll(studentId: string, page = 1, pageSize = 20) {
    const { items, total } = await this.quizRepository.findByStudentId(studentId, page, pageSize);
    return {
      data: items.map((q) => this.serializeQuiz(q, false)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(quizId: string, studentId: string) {
    const quiz = await this.findReadyQuiz(quizId, studentId);
    // Return questions without answers (correctIndex, explanation hidden via schema select:false)
    return this.serializeQuiz(quiz, true);
  }

  async getStatus(quizId: string, studentId: string) {
    const quiz = await this.findAndCheckOwnership(quizId, studentId);
    return {
      quizId: quiz.quizId,
      status: quiz.status,
      title: quiz.title,
      generationError: quiz.generationError,
    };
  }

  async submit(quizId: string, studentId: string, dto: SubmitQuizDto) {
    const quiz = await this.findReadyQuiz(quizId, studentId);

    if (quiz.status === QuizStatus.SUBMITTED) {
      throw new ConflictException({ code: 'QUIZ_ALREADY_SUBMITTED', message: 'Quiz already submitted' });
    }

    // Load with correct answers to evaluate
    const quizWithAnswers = await this.quizRepository.findByIdWithAnswers(quizId);
    if (!quizWithAnswers) {
      throw new NotFoundException({ code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' });
    }

    const questionMap = new Map(
      quizWithAnswers.questions.map((q: any) => [q.questionId, q]),
    );

    if (dto.answers.length !== quizWithAnswers.questions.length) {
      throw new UnprocessableEntityException({
        code: 'ANSWER_COUNT_MISMATCH',
        message: `Expected ${quizWithAnswers.questions.length} answers, received ${dto.answers.length}`,
      });
    }

    let correctCount = 0;
    const evaluatedAnswers = dto.answers.map((answer) => {
      const question = questionMap.get(answer.questionId) as any;
      if (!question) {
        throw new UnprocessableEntityException({
          code: 'INVALID_QUESTION_ID',
          message: `Unknown question: ${answer.questionId}`,
        });
      }
      const isCorrect = answer.selectedIndex === question.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: answer.questionId,
        selectedIndex: answer.selectedIndex,
        isCorrect,
      };
    });

    await this.quizRepository.submitAnswers(quizId, evaluatedAnswers, correctCount);

    const scorePercent = Math.round((correctCount / quizWithAnswers.questions.length) * 100);

    const result = {
      quizId,
      score: correctCount,
      totalQuestions: quizWithAnswers.questions.length,
      scorePercent,
      answers: evaluatedAnswers.map((a) => ({
        ...a,
        questionText: (questionMap.get(a.questionId) as any)?.text,
        explanation: (questionMap.get(a.questionId) as any)?.explanation,
        correctIndex: (questionMap.get(a.questionId) as any)?.correctIndex,
      })),
    };

    this.logger.log(`Quiz ${quizId} submitted: ${correctCount}/${quizWithAnswers.questions.length}`);

    // Fire-and-forget — don't fail the submission if analytics update fails
    this.analyticsService
      .recordQuizResult(studentId, quiz.topic, scorePercent)
      .catch((err) => this.logger.warn(`Analytics update failed for quiz ${quizId}: ${(err as Error).message}`));

    return result;
  }

  async delete(quizId: string, studentId: string): Promise<void> {
    await this.findAndCheckOwnership(quizId, studentId);
    await this.quizRepository.softDelete(quizId);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findAndCheckOwnership(quizId: string, studentId: string) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundException({ code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' });
    }
    if (quiz.studentId !== studentId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return quiz;
  }

  private async findReadyQuiz(quizId: string, studentId: string) {
    const quiz = await this.findAndCheckOwnership(quizId, studentId);
    if (quiz.status !== QuizStatus.READY && quiz.status !== QuizStatus.SUBMITTED) {
      throw new UnprocessableEntityException({
        code: quiz.status === QuizStatus.FAILED ? 'QUIZ_GENERATION_FAILED' : 'QUIZ_NOT_READY',
        message: quiz.status === QuizStatus.FAILED
          ? 'Quiz generation failed'
          : 'Quiz is still being generated',
      });
    }
    return quiz;
  }

  private serializeQuiz(quiz: any, includeQuestions: boolean) {
    return {
      quizId: quiz.quizId,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questionCount: quiz.questionCount,
      status: quiz.status,
      title: quiz.title,
      ...(includeQuestions && quiz.questions?.length
        ? {
            questions: quiz.questions.map((q: any) => ({
              questionId: q.questionId,
              text: q.text,
              options: q.options,
            })),
          }
        : {}),
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      submittedAt: quiz.submittedAt,
      documentIds: quiz.documentIds,
      challengeMode: quiz.challengeMode,
      timeLimitMinutes: quiz.timeLimitMinutes,
      challengeTopics: quiz.challengeTopics,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  }
}
