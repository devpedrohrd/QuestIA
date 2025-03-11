import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator'
import { FilterQuizDTO } from './filterQuiz.DTO'

export enum TipoQuestao {
  MULTIPLA_ESCOLHA = 'multipla escolha',
  VERDADEIRO_FALSO = 'verdadeiro ou falso',
}

export enum NivelDificuldade {
  FACIL = 'facil',
  MEDIO = 'medio',
  DIFICIL = 'dificil',
}

export enum contextoEducacional {
  ENSINO_MEDIO = 'ensino medio',
  ENSINO_SUPERIOR = 'ensino superior',
  ENEM = 'enem',
  VESTIBULAR = 'vestibular',
}

export class FilterPromptsDTO implements Partial<FilterQuizDTO> {
  @IsInt()
  @IsOptional()
  quantidade: number = 10

  @IsEnum(TipoQuestao)
  @IsOptional()
  tipoDePergunta: TipoQuestao = TipoQuestao.MULTIPLA_ESCOLHA

  @IsString()
  @Length(3, 25, { message: 'O tema deve ter entre 3 e 25 caracteres' })
  @IsOptional()
  tema: string

  @IsEnum(NivelDificuldade)
  @IsOptional()
  nivelDeDificuldade: NivelDificuldade = NivelDificuldade.MEDIO

  @IsEnum(contextoEducacional)
  @IsOptional()
  contextoEducacional: contextoEducacional = contextoEducacional.ENSINO_MEDIO
}
