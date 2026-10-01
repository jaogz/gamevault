import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Bio pode ter no máximo 280 caracteres' })
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
