import { LoginDto } from '../../../application/dto/login.dto';
import { AuthResponseDto } from '../../../application/dto/auth-response.dto';

export interface AuthUseCase {
  login(loginDto: LoginDto): Promise<AuthResponseDto>;
}

export const AUTH_USE_CASE = Symbol('AUTH_USE_CASE');
