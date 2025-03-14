import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '@nestjs/passport'
import { Role } from '@prisma/client'
import { Request } from 'express'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>()
    const token = request.cookies['access_token']

    if (!token) {
      throw new UnauthorizedException('Token de acesso não encontrado.')
    }

    let user: any

    try {
      user = await this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      })

      request['user'] = user
    } catch (error) {
      console.log(error)

      throw new ForbiddenException('Token inválido ou expirado')
    }

    try {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>('role', [
        context.getHandler(),
        context.getClass(),
      ])

      if (!requiredRoles || requiredRoles.length === 0) {
        return true
      }

      if (!user.role) {
        throw new ForbiddenException('Usuário sem permissão')
      }

      const hasRole = requiredRoles.includes(user.role)
      if (!hasRole) {
        throw new ForbiddenException(
          `Acesso negado! É necessário ser ${requiredRoles.join(', ')}`,
        )
      }

      return true
    } catch (err) {
      console.log(err)

      throw new UnauthorizedException('Token inválido ou expirado.')
    }
  }
}
