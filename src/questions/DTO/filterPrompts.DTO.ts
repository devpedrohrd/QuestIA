import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator'

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

export class FilterPromptsDTO {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  tema: string
  @IsEnum(TipoQuestao)
  @IsNotEmpty()
  tipoDePergunta: TipoQuestao
  @IsEnum(NivelDificuldade)
  @IsNotEmpty()
  nivelDeDificuldade: NivelDificuldade
  @IsInt()
  @IsOptional()
  quantidade?: number | 10
  @IsEnum(contextoEducacional)
  @IsOptional()
  contextoEducacional?: contextoEducacional
}
