import { Module } from '@nestjs/common'
import { QuizzesModule } from './quizzes/quizzes.module'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { QuestionsModule } from './questions/questions.module'
import { AnswerModule } from './answer/answer.module'

@Module({
  imports: [
    QuizzesModule,
    ConfigModule.forRoot(),
    AuthModule,
    QuestionsModule,
    AnswerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
