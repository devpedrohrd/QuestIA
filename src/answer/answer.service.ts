import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
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

  async rankingStudents(quizId: string) {
    const quizExists = await this.prismaService.quiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    })

    if (!quizExists) {
      throw new NotFoundException('Quiz não encontrado!')
    }

    const attempts = await this.prismaService.response.findMany({
      where: { quizId },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        responsesAnswers: {
          select: {
            correto: true,
          },
        },
      },
    })

    const rankingMap = new Map<string, any>()

    attempts.forEach((attempt) => {
      const alunoId = attempt.aluno.id
      const acertos = attempt.responsesAnswers.filter(
        (res) => res.correto,
      ).length
      const totalRespostas = attempt.responsesAnswers.length
      const desempenho = ((acertos / totalRespostas) * 100).toFixed(2) + '%'

      if (rankingMap.has(alunoId)) {
        rankingMap.get(alunoId).tentativas += 1

        if (acertos > rankingMap.get(alunoId).acertos) {
          rankingMap.get(alunoId).acertos = acertos
          rankingMap.get(alunoId).desempenho = desempenho
        }
      } else {
        rankingMap.set(alunoId, {
          alunoId,
          nome: attempt.aluno.nome,
          email: attempt.aluno.email,
          acertos,
          totalRespostas,
          desempenho,
          tentativas: 1,
        })
      }
    })

    return Array.from(rankingMap.values()).sort((a, b) => b.acertos - a.acertos)
  }

  async getBestAttemptByAluno(quizId: string, user: any) {
    const attempts = await this.prismaService.response.findMany({
      where: {
        quizId,
        alunoId: user.id,
      },
      include: {
        responsesAnswers: {
          include: {
            question: {
              include: {
                alternatives: true,
              },
            },
          },
        },
        quiz: true,
      },
    })

    if (attempts.length === 0) {
      throw new NotFoundException('Nenhuma tentativa encontrada')
    }

    const sorted = attempts.sort((a, b) => {
      const acertosA = a.responsesAnswers.filter((r) => r.correto).length
      const acertosB = b.responsesAnswers.filter((r) => r.correto).length
      return acertosB - acertosA
    })

    return sorted[0] // Retorna a tentativa com mais acertos
  }
}
