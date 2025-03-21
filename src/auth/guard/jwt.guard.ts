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

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const authorization = request.headers['authorization']

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new ForbiddenException('Token de autenticação ausente ou inválido')
    }

    const token = authorization.replace('Bearer ', '')
    let user: any

    try {
      console.log('JwtAuthGuard: Verificando token...')
      user = await this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      })

      console.log('JwtAuthGuard: Token verificado com sucesso. Usuário:', user)
      request['user'] = user
    } catch (error) {
      console.error('JwtAuthGuard: Erro ao verificar o token:', error)
      throw new ForbiddenException('Token inválido ou expirado')
    }

    try {
      console.log('JwtAuthGuard: Verificando roles...')
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>('role', [
        context.getHandler(),
        context.getClass(),
      ])

      console.log('JwtAuthGuard: Roles requeridas:', requiredRoles)

      if (!requiredRoles || requiredRoles.length === 0) {
        console.log('JwtAuthGuard: Nenhuma role requerida. Acesso permitido.')
        return true
      }

      if (!user.role) {
        console.log('JwtAuthGuard: Usuário sem permissão.')
        throw new ForbiddenException('Usuário sem permissão')
      }

      const hasRole = requiredRoles.includes(user.role)
      if (!hasRole) {
        console.log('JwtAuthGuard: Acesso negado. Role do usuário:', user.role)
        throw new ForbiddenException(
          `Acesso negado! É necessário ser ${requiredRoles.join(', ')}`,
        )
      }

      console.log(
        'JwtAuthGuard: Role verificada com sucesso. Acesso permitido.',
      )
      return true
    } catch (err) {
      console.error('JwtAuthGuard: Erro ao verificar roles:', err)
      throw new UnauthorizedException('Token inválido ou expirado.')
    }
  }
}