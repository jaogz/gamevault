import { IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(3, { message: 'Usuário precisa ter pelo menos 3 caracteres' })
  username: string;

  @IsString()
  @MinLength(4, { message: 'Senha precisa ter pelo menos 4 caracteres' })
  password: string;
}
