import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { FilterQuizDTO } from './DTO/filterQuiz.DTO'
import { Readable } from 'stream'

@Injectable()
export class QuestionsService {
  private readonly modelGeminiFlash: GenerativeModel
  constructor(
    private readonly genAI: GoogleGenerativeAI,
    private readonly prismaService: PrismaService,
  ) {
    const API_KEY = process.env.API_GEMINI || ''
    this.genAI.apiKey = API_KEY
    this.modelGeminiFlash = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    })
  }

  async gerarQuiz(filterQuizDTO: FilterQuizDTO, user: any) {
    console.log(user)

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
          professorId: id,
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

  async gerarQuestoes(quizId: string, user: any): Promise<string> {
    const quiz = await this.prismaService.quiz.findFirst({
      where: {
        professorId: user.id,
        id: {
          equals: quizId,
        },
      },
    })

    if (!quiz) {
      throw new NotFoundException(
        'Quiz não encontrado ou não pertence ao usuário.',
      )
    }

    // Criando o prompt para geração de questões
    const prompt = `
      Gere ${quiz.quantidade} questões do tipo ${quiz.tipoPergunta === 'multipla_escolha' ? 'Múltipla Escolha' : 'Verdadeiro ou Falso'}
      sobre o tema "${quiz.tema}". O nível de dificuldade deve ser "${quiz.nivelDificuldade}".
  
      Formato esperado da resposta em JSON:
      [
        {
          "pergunta": "Texto da questão gerada",
          "tipo": "${quiz.tipoPergunta}",
          "alternativas": ${
            quiz.tipoPergunta === 'multipla_escolha'
              ? `[ { "letra": "A", "texto": "Alternativa A" },
                 { "letra": "B", "texto": "Alternativa B" },
                 { "letra": "C", "texto": "Alternativa C" },
                 { "letra": "D", "texto": "Alternativa D" },
                  { "letra": "E", "texto": "Alternativa E" } ]`
              : `null`
          },
          "respostaCorreta": ${quiz.tipoPergunta === 'multipla_escolha' ? '"C"' : '"Verdadeiro"'},
          "explicacao": "Explicação detalhada sobre a resposta correta."
        }
      ]
    `
    try {
      const result = await this.modelGeminiFlash.generateContent(prompt)

      if (!result || !result.response) {
        throw new Error('Resposta vazia da API Gemini')
      }

      const responseText = result.response
        .text()
        .replace(/```json|```/g, '')
        .trim()
      const questoesGeradas = JSON.parse(responseText)

      if (!Array.isArray(questoesGeradas) || questoesGeradas.length === 0) {
        throw new Error('Formato inválido da resposta da IA')
      }

      const questoesStream = Readable.from(questoesGeradas)

      questoesStream.on('data', async (questao) => {
        try {
          const question = await this.prismaService.question.create({
            data: {
              quizId: quiz.id,
              pergunta: questao.pergunta,
              tipo: questao.tipo,
              respostaCorreta: questao.respostaCorreta,
              explicacao: questao.explicacao,
            },
          })

          if (questao.alternativas && Array.isArray(questao.alternativas)) {
            await this.prismaService.alternative.createMany({
              data: questao.alternativas.map((alt) => ({
                questionId: question.id,
                letra: alt.letra,
                texto: alt.texto,
              })),
            })
          }

          console.log(`Questão salva: ${question.id}`)
        } catch (error) {
          console.error('Erro ao salvar questão:', error)
        }
      })

      questoesStream.on('end', () => {
        console.log('Todas as questões foram processadas.')
      })

      return 'As questões estão sendo geradas e armazenadas no banco.'
    } catch (error) {
      console.error('Erro ao gerar e salvar questões:', error)
      throw new UnauthorizedException(
        'Ocorreu um erro ao gerar e armazenar as questões.',
      )
    }
  }

  async findQuestionOfQuizz(quizId: string, userId: string) {
    const quiz = await this.prismaService.$transaction(async (prisma) => {
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          professorId: userId,
        },
      })

      if (!quiz) {
        throw new NotFoundException(
          'Quiz não encontrado ou não pertence ao usuário.',
        )
      }

      const questions = await prisma.question.findMany({
        where: {
          quizId,
          quiz: {
            professorId: userId,
          },
        },
        include: {
          alternatives: {
            omit: {
              id: true,
              questionId: true,
            },
          },
        },
        omit: {
          respostaCorreta: true,
          explicacao: true,
        },
      })

      return questions
    })

    const questions = quiz

    if (!questions || questions.length === 0) {
      throw new NotFoundException('Nenhuma questão encontrada para este quiz.')
    }

    return questions
  }
}
