import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/config/Database/Prisma.service'

@Injectable()
export class AnswerService {
  constructor(private readonly prismaService: PrismaService) {}

  async findQuizzesOfUser(user: any, quizId: string) {
    const userE = await this.prismaService.user.findFirst({
      where: {
        id: user.id,
      },
    })

    if (!userE) {
      throw new UnauthorizedException('Usuário não autenticado')
    }

    const quizzesRespondidos = await this.prismaService.response.findMany({
      where: {
        alunoId: userE.id,
        quizId,
      },
      include: {
        quiz: {
          select: {
            id: true,
            titulo: true,
            tema: true,
            nivelDificuldade: true,
            tipoPergunta: true,
          },
        },
        responsesAnswers: {
          select: {
            respostaEscolhida: true,
            correto: true,
            question: {
              select: {
                id: true,
                pergunta: true,
                respostaCorreta: true,
                explicacao: true,
                alternatives: {
                  select: {
                    letra: true,
                    texto: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return quizzesRespondidos
  }

  async rankingStudents(quizId: string) {}
}
