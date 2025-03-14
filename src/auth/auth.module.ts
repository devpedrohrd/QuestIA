// auth.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtAuthGuard } from './guard/jwt.guard'
import { GoogleStrategy } from './strategies/google.strategy'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { PassportModule } from '@nestjs/passport'
import { QuizzesModule } from 'src/quizzes/quizzes.module'

@Module({
  imports: [
    QuizzesModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
    PassportModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [JwtAuthGuard, GoogleStrategy, AuthService, PrismaService],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
