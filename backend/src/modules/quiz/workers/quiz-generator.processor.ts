import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QuizRepository } from '../quiz.repository';
import { AiGatewayService } from '../../ai-gateway/ai-gateway.service';
import { QuizStatus, DifficultyLevel } from '../schemas/quiz.schema';

export const QUIZ_GENERATION_QUEUE = 'quiz-generation';

export interface QuizGenerationJob {
  quizId: string;
  studentId: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  documentIds: string[];
}

@Processor(QUIZ_GENERATION_QUEUE)
export class QuizGeneratorWorker extends WorkerHost {
  private readonly logger = new Logger(QuizGeneratorWorker.name);

  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly aiGateway: AiGatewayService,
  ) {
    super();
  }

  async process(job: Job<QuizGenerationJob>): Promise<void> {
    const { quizId, studentId, topic, difficulty, questionCount, documentIds } = job.data;
    this.logger.log(`Generating quiz ${quizId}: "${topic}" (${difficulty}, ${questionCount}q)`);

    try {
      await this.quizRepository.updateStatus(quizId, QuizStatus.GENERATING);

      const result = await this.aiGateway.generateQuiz({
        quizId,
        studentId,
        topic,
        difficulty,
        questionCount,
        documentIds,
      });

      await this.quizRepository.updateStatus(quizId, QuizStatus.READY, {
        title: result.title,
        questions: result.questions as any,
      });

      this.logger.log(`Quiz ${quizId} generated: "${result.title}" (${result.questions.length} questions)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      this.logger.error(`Quiz ${quizId} generation failed: ${message}`);

      await this.quizRepository.updateStatus(quizId, QuizStatus.FAILED, {
        generationError: message,
      });
    }
  }
}
