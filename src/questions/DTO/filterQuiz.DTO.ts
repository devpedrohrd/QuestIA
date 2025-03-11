import { $Enums, Quiz } from '@prisma/client'
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

export class FilterQuizDTO implements Quiz {
  @IsString()
  @IsOptional()
  id: string
  @IsString()
  @IsNotEmpty()
  titulo: string
  @IsString()
  @IsNotEmpty()
  tema: string
  @IsEnum($Enums.NivelDificuldade)
  @IsOptional()
  nivelDificuldade: $Enums.NivelDificuldade = $Enums.NivelDificuldade.medio
  @IsInt()
  @IsOptional()
  quantidade: number
  @IsEnum($Enums.TipoPergunta)
  @IsOptional()
  tipoPergunta: $Enums.TipoPergunta = $Enums.TipoPergunta.multipla_escolha
  @IsString()
  @IsOptional()
  professorId: string
  @IsString()
  @IsOptional()
  link: string = ''
  @IsEnum($Enums.Status)
  @IsOptional()
  status: $Enums.Status = $Enums.Status.ativo
  @IsDate()
  @IsOptional()
  createdAt: Date
}
