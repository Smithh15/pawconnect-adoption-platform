import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard opcional: si viene token JWT lo valida y setea req.user.
 * Si no viene token (o es inválido), deja pasar la request con req.user = undefined.
 * Ideal para rutas públicas que también aprovechan el contexto del usuario logueado.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    // No lanzar error aunque no haya usuario o el token sea inválido
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
