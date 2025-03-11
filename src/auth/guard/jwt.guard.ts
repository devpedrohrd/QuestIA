import {
  CanActivate,
  ExecutionContext,
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

    try {
      const decoded = await this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      })

      const userReq = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }

      request['user'] = userReq
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>('role', [
        context.getHandler(),
        context.getClass(),
      ])

      if (!requiredRoles) {
        return true
      }

      const hasRole = requiredRoles.includes(request['user'].role)

      if (!hasRole) {
        throw new UnauthorizedException(
          `Acesso negado. È necessário ser ${requiredRoles.join(', ')} .`,
        )
      }

      return hasRole
    } catch (err) {
      throw new UnauthorizedException('Token inválido ou expirado.')
    }
  }
}
