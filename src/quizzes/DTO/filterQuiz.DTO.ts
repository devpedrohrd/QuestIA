import { $Enums, Quiz } from '@prisma/client'
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator'

export class FilterQuizDTO implements Quiz {
  @IsUUID()
  @IsOptional()
  id: string
  @IsString()
  @IsNotEmpty()
  @Length(3, 50, { message: 'O título deve ter entre 3 e 50 caracteres' })
  titulo: string
  @IsString()
  @IsNotEmpty()
  @Length(3, 30, { message: 'O tema deve ter entre 3 e 15 caracteres' })
  tema: string
  @IsEnum($Enums.NivelDificuldade, {
    message: 'O nível de dificuldade deve ser fácil, médio ou difícil',
  })
  @IsOptional()
  nivelDificuldade: $Enums.NivelDificuldade = $Enums.NivelDificuldade.medio
  @IsInt()
  @IsOptional()
  quantidade: number
  @IsEnum($Enums.TipoPergunta)
  @IsOptional()
  tipoPergunta: $Enums.TipoPergunta = $Enums.TipoPergunta.multipla_escolha
  @IsUUID()
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
