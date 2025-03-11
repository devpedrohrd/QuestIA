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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { access_token, refresh_token } = await this.authService.login(
      req['user'],
    )

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 15 * 60 * 1000),
    })

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return res.json({
      message: 'Login realizado com sucesso',
      user: req['user'],
      access_token,
      refresh_token,
    })
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token']
    if (!refreshToken)
      throw new UnauthorizedException('Refresh Token não encontrado')

    const { refresh_token, access_token } =
      await this.authService.refreshToken(refreshToken)

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 15 * 60 * 1000),
    })

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return res.json({
      message: 'Refresh Token realizado com sucesso',
      access_token,
      refresh_token,
    })
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    return res.json({ message: 'Logout realizado com sucesso' })
  }
}
