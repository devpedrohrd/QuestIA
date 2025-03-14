import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { QuizzesService } from './quizzes.service'
import { Roles } from 'src/decorators/Roles.decorator'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard'
import { Request } from 'express'
import { FilterQuizDTO } from './DTO/filterQuiz.DTO'
import { ResponseUserFormDTO } from './DTO/responseUserForm.DTO'
import { userReq } from 'mocks'

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly questionsService: QuizzesService) {}

  @Post(':quizId/questions/generate')
  @Roles(Role.professor)
  async generateQuestions(
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    // const user = req.user; // Extrai o usuário autenticado
    return this.questionsService.gerarQuestoes(quizId, userReq)
  }

  // Endpoint para listar questões de um quiz
  @Get(':quizId/questions')
  @Roles(Role.professor, Role.aluno)
  async getQuestions(@Param('quizId') quizId: string, @Req() req: Request) {
    const user = req['user'] // Extrai o usuário autenticado

    return this.questionsService.findQuestionOfQuizz(quizId, user.id)
  }

  @Post()
  @Roles(Role.professor)
  async createQuiz(@Body() filterQuizDTO: FilterQuizDTO, @Req() req: Request) {
    // const user = req['user'] // Extrai o usuário autenticado
    return this.questionsService.gerarQuiz(filterQuizDTO, userReq)
  }

  @Post(':quizId/responses')
  @Roles(Role.professor, Role.aluno)
  async gradeQuizResponses(
    @Param('quizId') quizId: string,
    @Body() responseUserForm: ResponseUserFormDTO[],
    @Req() req: Request,
  ) {
    return this.questionsService.amendQuestions(
      responseUserForm,
      userReq.id,
      quizId,
    )
  }

  @Get()
  @Roles(Role.professor)
  async getQuizzes(@Req() req: Request) {
    // const user = req.user; // Extrai o usuário autenticado
    console.log('userReq', userReq)

    return this.questionsService.findAllQuiz(userReq)
  }
}
