import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AnswerService } from './answer.service'
import { Request } from 'express'
import { userReq } from 'mocks'
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard'

@Controller('answer')
@UseGuards(JwtAuthGuard)
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Get(':quizId')
  async findQuizzesOfUser(
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    return await this.answerService.findQuizzesOfUser(userReq, quizId)
  }
}
