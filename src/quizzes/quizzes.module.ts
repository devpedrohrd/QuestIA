import { Module } from '@nestjs/common'
import { QuizzesService } from './quizzes.service'
import { QuizzesController } from './quizzes.controller'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { ConfigService } from '@nestjs/config'

@Module({
  controllers: [QuizzesController],
  providers: [QuizzesService, GoogleGenerativeAI, PrismaService, ConfigService],
})
export class QuizzesModule {}
