import { Module } from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { QuestionsController } from './questions.controller'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { GoogleGenerativeAI } from '@google/generative-ai'

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, PrismaService, GoogleGenerativeAI],
})
export class QuestionsModule {}
