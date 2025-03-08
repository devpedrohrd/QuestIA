import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { FilterPromptsDTO, TipoQuestao } from './DTO/filterPrompts.DTO'
import { QuestaoGerada } from './DTO/QuestaoGerada.DTO'

@Injectable()
export class QuestionsService {
  async geminiService(
    filterPrompts: FilterPromptsDTO,
  ): Promise<QuestaoGerada[] | string> {
    const API_GEMINI = process.env.API_GEMINI || ''

    const genAI = new GoogleGenerativeAI(API_GEMINI)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const {
      quantidade,
      tipoDePergunta,
      tema,
      nivelDeDificuldade,
      contextoEducacional,
    } = filterPrompts

    const prompt = `
      Gere ${quantidade} questões do tipo ${tipoDePergunta === TipoQuestao.MULTIPLA_ESCOLHA ? 'Múltipla Escolha' : 'Verdadeiro ou Falso'} 
      sobre o tema ${tema}. O nível de dificuldade deve ser ${nivelDeDificuldade}.
  
      Se possível, siga o contexto educacional: ${contextoEducacional || 'Geral'}.
  
      Formato esperado de resposta em JSON (um array de objetos):
      [
        {
          "pergunta": "Texto da pergunta gerada",
          "tipo": "${tipoDePergunta}",
          "alternativas": ${
            tipoDePergunta === TipoQuestao.MULTIPLA_ESCOLHA
              ? `[ { "letra": "A", "texto": "Alternativa A" },
                 { "letra": "B", "texto": "Alternativa B" },
                 { "letra": "C", "texto": "Alternativa C" },
                 { "letra": "D", "texto": "Alternativa D" },
                  { "letra": "E", "texto": "Alternativa E" } ]`
              : `null`
          },
          "respostaCorreta": ${tipoDePergunta === TipoQuestao.MULTIPLA_ESCOLHA ? '"C"' : '"Verdadeiro"'},
          "explicacao": "Explicação detalhada sobre a resposta correta."
        }
      ]
    `

    try {
      const result = await model.generateContent(prompt)

      if (!result || !result.response) {
        throw new Error('Resposta vazia da API Gemini')
      }

      const responseText = result.response
        .text()
        .replace(/```json|```/g, '')
        .trim()
      const questoes: QuestaoGerada[] = JSON.parse(responseText)

      return questoes
    } catch (error) {
      console.error('Erro ao gerar questões:', error)
      return 'Ocorreu um erro ao gerar as questões.'
    }
  }
}
