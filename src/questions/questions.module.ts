import { Module } from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { QuestionsController } from './questions.controller'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaService } from 'src/config/Database/Prisma.service'

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, GoogleGenerativeAI, PrismaService],
})
export class QuestionsModule {}
