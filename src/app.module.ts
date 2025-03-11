import { Module } from '@nestjs/common'
import { QuestionsModule } from './questions/questions.module'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [QuestionsModule, ConfigModule.forRoot(), AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
