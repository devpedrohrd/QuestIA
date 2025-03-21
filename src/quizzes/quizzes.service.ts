import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { FilterQuizDTO } from './DTO/filterQuiz.DTO'

@Injectable()
export class QuizzesService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateQuiz(filterQuizDTO: FilterQuizDTO, user: any) {
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
        throw new ConflictException('Quiz already exists')
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
        throw new BadRequestException('Error creating quiz')
      }

      const uniqueLink = `${process.env.BACKEND_URL}/questions/${createdQuiz.id}`

      const updatedQuiz = await this.prismaService.quiz.update({
        where: { id: createdQuiz.id },
        data: { link: uniqueLink },
      })

      if (!updatedQuiz) {
        throw new InternalServerErrorException('Error generating quiz link')
      }

      return createdQuiz
    } catch (error) {
      console.error('Error generating and saving quiz:', error)
      throw error
    }
  }

  async findAllQuizzes(user: any) {
    const { id, role } = user

    try {
      let quizzes: any = []

      if (role === 'aluno') {
        quizzes = await this.prismaService.quiz.findMany({
          where: {
            responses: {
              some: {
                alunoId: id,
              },
            },
          },
          include: {
            professor: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
          omit: {
            createdAt: true,
            status: true,
          },
        })
      } else if (role === 'professor') {
        quizzes = await this.prismaService.quiz.findMany({
          where: {
            professorId: id,
          },
          include: {
            _count: {
              select: {
                responses: true,
              },
            },
          },
          omit: {
            createdAt: true,
            status: true,
          },
        })
      } else {
        throw new Error('Tipo de usuário não reconhecido')
      }

      if (!quizzes || quizzes.length === 0) {
        throw new NotFoundException('Nenhum quiz encontrado')
      }

      return quizzes
    } catch (error) {
      console.error('Erro ao buscar quizzes:', error)
      throw error
    }
  }

  async deleteQuiz(quizId: string, user: any) {
    const quizExisting = await this.prismaService.quiz.findFirst({
      where: {
        id: quizId,
        professorId: user.id,
      },
    })

    if (!quizExisting) {
      throw new NotFoundException(
        'Quiz not found or does not belong to this user!',
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

      return { message: 'Quiz deleted successfully!' }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      throw new InternalServerErrorException('Error deleting the quiz.')
    }
  }
}