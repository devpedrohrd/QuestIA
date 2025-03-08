import { TipoQuestao } from './filterPrompts.DTO'

export interface QuestaoGerada {
  id: string
  pergunta: string
  tipo: TipoQuestao
  alternativas?: { letra: string; texto: string }[]
  respostaCorreta: string
  explicacao: string
}

export interface GerarQuestoesResponse {
  questoes: QuestaoGerada[]
}
