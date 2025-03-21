import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { AnswerService } from './answer.service'
import { Request } from 'express'
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard'
import { userReq } from 'mocks'
import { Roles } from 'src/decorators/Roles.decorator'
import { Role } from '@prisma/client'

@Controller('answer')
@UseGuards(JwtAuthGuard)
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Get(':quizId')
  async findQuizzesOfUser(
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    return await this.answerService.findQuizzesOfUser(req['user'], quizId)
  }

  @Get('/ranking/:quizId')
  @Roles(Role.professor)
  async findResponsesStudents(@Param('quizId') quizId: string) {
    return this.answerService.rankingStudents(quizId)
  }
}
