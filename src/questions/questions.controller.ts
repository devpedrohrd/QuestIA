import { Body, Controller, Post } from '@nestjs/common'
import { QuestionsService } from './questions.service'
import { FilterPromptsDTO } from './DTO/filterPrompts.DTO'

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('gemini')
  async geminiService(@Body() filterPromptsDTO: FilterPromptsDTO) {
    return this.questionsService.geminiService(filterPromptsDTO)
  }
}
