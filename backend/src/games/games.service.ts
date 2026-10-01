import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateGameDto) {
    return this.prisma.game.create({ data: dto });
  }

  findAll(userId?: string) {
    const where = userId ? { userId: Number(userId) } : {};
    return this.prisma.game.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Jogo não encontrado');
    return game;
  }

  async update(id: number, dto: UpdateGameDto) {
    await this.findOne(id);
    return this.prisma.game.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.game.delete({ where: { id } });
  }

  async searchExternal(query: string) {
    if (!query || query.trim().length < 2) return [];

    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      query,
    )}&l=english&cc=US`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      return (data.items || []).slice(0, 8).map((item: any) => ({
        appid: item.id,
        name: item.name,
        image: item.tiny_image,
      }));
    } catch (err) {
      return [];
    }
  }

  private mapGenre(steamGenres: { description: string }[] = []): string {
    const names = steamGenres.map((g) => g.description.toLowerCase());
    if (names.some((n) => n.includes('rpg'))) return 'RPG';
    if (names.some((n) => n.includes('action'))) return 'Ação';
    if (names.some((n) => n.includes('adventure'))) return 'Aventura';
    if (names.some((n) => n.includes('strategy'))) return 'Estratégia';
    if (names.some((n) => n.includes('casual') || n.includes('puzzle'))) return 'Puzzle';
    if (names.some((n) => n.includes('sports') || n.includes('racing'))) return 'Esporte';
    return 'Outro';
  }

  async getExternalDetails(appid: string) {
    if (!appid) return null;

    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const entry = data?.[appid];
      if (!entry?.success) return null;

      const info = entry.data;
      return {
        genre: this.mapGenre(info.genres),
        description: info.short_description || '',
        image: info.header_image || null,
      };
    } catch (err) {
      return null;
    }
  }
}
