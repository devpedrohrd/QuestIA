import { Module } from '@nestjs/common'
import { QuestionsModule } from './questions/questions.module'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [QuestionsModule, ConfigModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
