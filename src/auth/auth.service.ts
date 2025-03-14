import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/config/Database/Prisma.service'
import { Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { Role } from '@prisma/client'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private async generateTokens(payload: any) {
    const access_token = await this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES'),
    })

    const refresh_token = await this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES'),
    })

    return { access_token, refresh_token }
  }

  async validateGoogleUser(profile: any) {
    const { id, displayName, emails } = profile
    const email = emails[0].value

    let user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId: id,
          nome: displayName,
          email,
          role: Role.aluno,
        },
      })
    }

    const userReq = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    return userReq
  }

  async login(user: any) {
    const payload = { id: user.id, email: user.email, role: user.role }
    const { access_token, refresh_token } = await this.generateTokens(payload)

    return { access_token, refresh_token }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      })

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      })

      if (!user) throw new UnauthorizedException('Refresh Token inválido')

      return await this.login(user)
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado')
    }
  }
}
