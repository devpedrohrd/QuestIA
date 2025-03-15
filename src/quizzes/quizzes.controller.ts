import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { QuizzesService } from './quizzes.service'
import { Roles } from 'src/decorators/Roles.decorator'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard'
import { Request } from 'express'
import { FilterQuizDTO } from './DTO/filterQuiz.DTO'

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @Roles(Role.professor)
  async createQuiz(@Body() filterQuizDTO: FilterQuizDTO, @Req() req: Request) {
    const user = req['user']
    return this.quizzesService.gerarQuiz(filterQuizDTO, user)
  }

  @Get()
  @Roles(Role.professor, Role.aluno)
  async getQuizzes(@Req() req: Request) {
    const user = req['user']

    return this.quizzesService.findAllQuiz(user)
  }

  @Delete(':quizId')
  @Roles(Role.professor)
  async deleteQuiz(@Param('quizId') quizId: string, @Req() req: Request) {
    return await this.quizzesService.deleteQuizzes(quizId, req['user'])
  }
}
