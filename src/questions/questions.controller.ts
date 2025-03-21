import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { CreateQuestionDto } from './dto/create-question.dto'
import { Request } from 'express'
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard'
import { Roles } from 'src/decorators/Roles.decorator'
import { Role } from '@prisma/client'
import { ResponseUserFormDTO } from 'src/questions/dto/responseUserForm.DTO'

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post(':quizId')
  @Roles(Role.professor)
  create(@Param('quizId') quizId: string, @Req() req: Request) {
    return this.questionsService.create(quizId, req['user'])
  }

  @Post('save/:quizId')
  async save(
    @Param('quizId') quizId: string,
    @Body() questionsGenereted: CreateQuestionDto[],
  ) {
    return this.questionsService.saveQuestions(questionsGenereted, quizId)
  }

  @Get(':quizId')
  @Roles(Role.professor, Role.aluno)
  async getQuestions(@Param('quizId') quizId: string, @Req() req: Request) {
    const user = req['user']

    return this.questionsService.findQuestionOfQuizz(quizId, user.id)
  }

  @Post(':quizId/responses')
  @Roles(Role.professor, Role.aluno)
  async gradeQuizResponses(
    @Param('quizId') quizId: string,
    @Body() responseUserForm: ResponseUserFormDTO[],
    @Req() req: Request,
  ) {
    return await this.questionsService.amendQuestions(
      responseUserForm,
      req['user'].id,
      quizId,
    )
  }
}
