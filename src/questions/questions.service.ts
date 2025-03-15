import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { CreateQuestionDto } from './dto/create-question.dto'
import { ResponseUserFormDTO } from 'src/questions/dto/responseUserForm.DTO'

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

  async create(quizId: string, user: any): Promise<CreateQuestionDto[]> {
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
        .replace(/```json|```/g, '') // Remove blocos de código
        .trim() // Remove espaços em branco no início e no final
        .replace(/\n/g, '') // Remove quebras de linha
        .replace(/\s+/g, ' ') // Remove espaços extras

      let questoesGeradas

      try {
        questoesGeradas = JSON.parse(responseText)
      } catch (error) {
        throw new Error(
          'Erro ao converter a resposta da IA para JSON: ' + error.message,
        )
      }

      if (!Array.isArray(questoesGeradas) || questoesGeradas.length === 0) {
        throw new Error('Formato inválido da resposta da IA')
      }

      return questoesGeradas
    } catch (error) {
      console.error('Erro ao gerar e salvar questões:', error)
      throw new UnauthorizedException(
        'Ocorreu um erro ao gerar e armazenar as questões.',
      )
    }
  }

  async saveQuestions(questionsGenereted: CreateQuestionDto[], quizId: string) {
    try {
      for (const questao of questionsGenereted) {
        try {
          const question = await this.prismaService.question.create({
            data: {
              quizId: quizId,
              pergunta: questao.pergunta,
              tipo: questao.tipo,
              respostaCorreta: questao.respostaCorreta,
              explicacao: questao.explicacao || '',
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
      }

      console.log('Todas as questões foram processadas.')
      return 'As questões foram armazenadas no banco com sucesso.'
    } catch (error) {
      console.error('Erro ao salvar questões:', error)
      throw new InternalServerErrorException(error)
    }
  }

  async findQuestionOfQuizz(quizId: string, userId: string) {
    const quiz = await this.prismaService.$transaction(async (prisma) => {
      await prisma.quiz.findFirst({
        where: {
          id: quizId,
        },
        include: {
          questions: true,
        },
      })

      const questions = await prisma.question.findMany({
        where: {
          quizId,
          quiz: {
            id: quizId,
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

  async amendQuestions(
    responseFormDTO: ResponseUserFormDTO[],
    alunoId: string,
    quizId: string,
  ) {
    const [aluno, quiz] = await Promise.all([
      this.prismaService.user.findUnique({
        where: { id: alunoId },
        select: { id: true },
      }),
      this.prismaService.quiz.findUnique({
        where: { id: quizId },
        select: { id: true },
      }),
    ])

    if (!aluno || !quiz) {
      throw new NotFoundException('Aluno ou quiz não encontrado.')
    }

    const response = await this.prismaService.response.create({
      data: {
        quizId,
        alunoId,
      },
    })

    let acertos = 0
    let erros = 0

    // Aqui estou iterando sobre as respostas do aluno e verificando se a questão existe e se a resposta está correta
    const resultados = await Promise.all(
      responseFormDTO.map(async (resposta) => {
        const question = await this.prismaService.question.findUnique({
          where: { id: resposta.questionId },
          select: { respostaCorreta: true, explicacao: true, tipo: true },
        })

        if (!question) {
          throw new NotFoundException(
            `Questão com ID ${resposta.questionId} não encontrada.`,
          )
        }

        let correto = false

        if (question.tipo === 'verdadeiro_falso') {
          const respostaEscolhidaNormalizada =
            resposta.respostaEscolhida === 'Verdadeiro'

          const respostaCorretaNormalizada =
            question.respostaCorreta === 'verdadeiro'

          correto = respostaEscolhidaNormalizada === respostaCorretaNormalizada
        } else if (question.tipo === 'multipla_escolha') {
          correto = resposta.respostaEscolhida === question.respostaCorreta
        }

        if (correto) {
          acertos++
        } else {
          erros++
        }

        await this.prismaService.responseAnswer.create({
          data: {
            responseId: response.id,
            questionId: resposta.questionId,
            respostaEscolhida: resposta.respostaEscolhida,
            correto,
          },
        })

        return {
          questionId: resposta.questionId,
          respostaEscolhida: resposta.respostaEscolhida,
          respostaCorreta: question.respostaCorreta,
          explicacao: question.explicacao,
          correto,
        }
      }),
    )

    return {
      resultados,
      acertos,
      erros,
    }
  }
}
