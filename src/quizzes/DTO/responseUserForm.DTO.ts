import { ResponseAnswer } from '@prisma/client'
import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class ResponseUserFormDTO implements Partial<ResponseAnswer> {
  @IsUUID()
  @IsNotEmpty()
  questionId: string
  @IsString()
  @IsNotEmpty()
  @IsIn(['A', 'B', 'C', 'D', 'E', 'verdadeiro', 'falso'], {
    message: 'A resposta deve ser A, B, C, D ou E',
  })
  respostaEscolhida: string
}
