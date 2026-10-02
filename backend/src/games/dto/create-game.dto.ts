import { IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGameDto {
  @IsNotEmpty({ message: 'Nome do jogo é obrigatório' })
  @IsString()
  name: string;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  // Um jogo pode ter vários gêneros
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  // true quando a descrição veio do catálogo (Steam) ou de outra biblioteca
  @IsOptional()
  @IsBoolean()
  fromCatalog?: boolean;

  // Sobre o jogo em si (sinopse/o que ele é)
  @IsOptional()
  @IsString()
  description?: string;

  // Opinião/consideração pessoal de quem cadastrou
  @IsOptional()
  @IsString()
  review?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  hoursPlayed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
