import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { Role } from '@prisma/client'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { access_token, refresh_token,role } = await this.authService.login(
      req['user'],
    )

    res.setHeader('Authorization', `Bearer ${access_token}`)
    res.setHeader('X-Refresh-Token', refresh_token)

    res.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/callback?access_token=${access_token}&refresh_token=${refresh_token}&role=${role}`,
    )
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.headers['authorization']?.replace('Bearer ', '')

    if (!refreshToken)
      throw new UnauthorizedException('Refresh Token não encontrado')

    return await this.authService.refreshToken(refreshToken)
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    return res.json({ message: 'Logout realizado com sucesso' })
  }
}
