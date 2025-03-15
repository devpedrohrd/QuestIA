import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { FilterQuizDTO } from './DTO/filterQuiz.DTO'

@Injectable()
export class QuizzesService {
  constructor(private readonly prismaService: PrismaService) {}

  async gerarQuiz(filterQuizDTO: FilterQuizDTO, user: any) {
    let {
      titulo,
      tipoPergunta,
      tema,
      status,
      quantidade,
      nivelDificuldade,
      professorId,
    } = filterQuizDTO

    professorId = user.id

    try {
      const quizExisting = await this.prismaService.quiz.findFirst({
        where: {
          titulo,
          professorId,
        },
      })

      if (quizExisting) {
        throw new UnauthorizedException('Quiz já existe')
      }

      const createdQuiz = await this.prismaService.quiz.create({
        data: {
          titulo,
          tipoPergunta,
          tema,
          status,
          quantidade,
          nivelDificuldade,
          professorId,
          link: '',
        },
      })

      if (!createdQuiz) {
        throw new UnauthorizedException('Erro ao criar quiz')
      }

      const uniqueLink = `http://localhost:3334/questions/${createdQuiz.id}`

      const updatedQuiz = await this.prismaService.quiz.update({
        where: { id: createdQuiz.id },
        data: { link: uniqueLink },
      })

      if (!updatedQuiz) {
        throw new UnauthorizedException('Erro ao gerar link do quiz')
      }

      return createdQuiz
    } catch (error) {
      console.error('Erro ao gerar e salvar quiz:', error)
      return 'Ocorreu um erro ao gerar e armazenar o quiz.'
    }
  }

  async findAllQuiz(user: any) {
    const { id } = user

    try {
      const quizzes = await this.prismaService.quiz.findMany({
        where: {
          responses: {
            some: {
              alunoId: id,
            },
          },
        },
      })

      if (!quizzes) {
        throw new UnauthorizedException('Nenhum quiz encontrado')
      }

      return quizzes
    } catch (error) {
      console.error('Erro ao buscar quizzes:', error)
      return 'Ocorreu um erro ao buscar os quizzes.'
    }
  }

  async deleteQuizzes(quizId: string, user: any) {
    const quizExisting = await this.prismaService.quiz.findFirst({
      where: {
        id: quizId,
        professorId: user.id,
      },
    })

    if (!quizExisting) {
      throw new NotFoundException(
        'Quiz não encontrado ou não pertence a este usuário!',
      )
    }

    try {
      await this.prismaService.$transaction(async (prisma) => {
        await prisma.responseAnswer.deleteMany({
          where: {
            response: {
              quizId: quizId,
            },
          },
        })

        await prisma.response.deleteMany({
          where: { quizId },
        })

        await prisma.alternative.deleteMany({
          where: {
            question: {
              quizId: quizId,
            },
          },
        })

        await prisma.question.deleteMany({
          where: { quizId },
        })

        await prisma.quiz.delete({
          where: { id: quizId },
        })
      })

      console.log('Quiz e todos os dados associados deletados com sucesso!')
      return { message: 'Quiz deletado com sucesso!' }
    } catch (error) {
      console.error('Erro ao deletar quiz:', error)
      throw new InternalServerErrorException('Erro ao deletar o quiz.')
    }
  }
}
