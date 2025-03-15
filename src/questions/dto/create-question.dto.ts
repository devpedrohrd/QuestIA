import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator'
import { Type } from 'class-transformer'

enum TipoPergunta {
  MULTIPLA_ESCOLHA = 'multipla_escolha',
  VERDADEIRO_FALSO = 'verdadeiro_falso',
}

class AlternativeDto {
  @IsString()
  @IsNotEmpty()
  letra: string

  @IsString()
  @IsNotEmpty()
  texto: string
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'A pergunta não pode estar vazia.' })
  pergunta: string

  @IsEnum(TipoPergunta, {
    message:
      'O tipo de pergunta deve ser "multipla_escolha" ou "verdadeiro_falso".',
  })
  tipo: TipoPergunta

  @IsString()
  @IsNotEmpty({ message: 'A resposta correta não pode estar vazia.' })
  respostaCorreta: string

  @IsString()
  @IsOptional()
  explicacao?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlternativeDto)
  @IsOptional()
  @ArrayMinSize(1, {
    message:
      'A questão de múltipla escolha deve ter pelo menos uma alternativa.',
  })
  alternativas?: AlternativeDto[]
}
