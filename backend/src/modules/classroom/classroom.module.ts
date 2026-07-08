import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Classroom, ClassroomSchema } from './schemas/classroom.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { ClassroomRepository } from './classroom.repository';
import { ClassroomService } from './classroom.service';
import { ClassroomController } from './classroom.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { QuizModule } from '../quiz/quiz.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Classroom.name, schema: ClassroomSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AnalyticsModule,
    QuizModule,
  ],
  controllers: [ClassroomController],
  providers: [ClassroomRepository, ClassroomService],
  exports: [ClassroomService],
})
export class ClassroomModule {}
