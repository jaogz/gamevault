import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

const USER_PREVIEW = { id: true, username: true, avatarUrl: true };

// Chave usada pra agrupar cópias do mesmo jogo na biblioteca de usuários diferentes.
const keyOf = (name: string) => (name || '').trim().toLowerCase();

// Jogos antigos só têm "genre"; os novos têm "genres". Sempre devolve a lista.
function withGenres(game: any) {
  const genres = game.genres?.length ? game.genres : game.genre ? [game.genre] : [];
  return { ...game, genres };
}

function decodeEntities(text: string) {
  return (text || '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

interface CatalogGroup {
  key: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  genres: string[];
  playerCount: number;
  ratingCount: number;
  avgRating: number | null;
  favoriteCount: number;
  lastAddedAt: Date;
  entries: any[];
}

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRUD ----------

  private genreData(dto: { genres?: string[]; genre?: string }) {
    if (dto.genres) {
      return { genres: dto.genres, genre: dto.genres[0] ?? null };
    }
    if (dto.genre) {
      return { genres: [dto.genre] };
    }
    return {};
  }

  async create(dto: CreateGameDto) {
    const data: any = { ...dto, ...this.genreData(dto) };
    const game = await this.prisma.game.create({ data });
    return withGenres(game);
  }

  async findAll(userId?: string) {
    const where = userId ? { userId: Number(userId) } : {};
    const games = await this.prisma.game.findMany({ where, orderBy: { createdAt: 'desc' } });
    return games.map(withGenres);
  }

  async findOne(id: number) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Jogo não encontrado');
    return withGenres(game);
  }

  async update(id: number, dto: UpdateGameDto) {
    const existing = await this.findOne(id);
    const data: any = { ...dto, ...this.genreData(dto) };

    // A descrição que veio do catálogo é do jogo, não de quem cadastrou: não pode ser alterada.
    if (existing.fromCatalog) {
      delete data.description;
      delete data.fromCatalog;
    }

    const game = await this.prisma.game.update({ where: { id }, data });
    return withGenres(game);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.game.delete({ where: { id } });
  }

  // ---------- Catálogo da comunidade ----------

  private async loadGroups(): Promise<CatalogGroup[]> {
    const games = await this.prisma.game.findMany({
      include: { user: { select: USER_PREVIEW } },
      orderBy: { createdAt: 'desc' },
    });

    const map = new Map<string, any>();

    for (const raw of games) {
      const game = withGenres(raw);
      const key = keyOf(game.name);
      if (!key) continue;

      let group = map.get(key);
      if (!group) {
        group = {
          key,
          name: game.name,
          imageUrl: null,
          description: null,
          genreCounts: new Map<string, number>(),
          users: new Set<number>(),
          ratingSum: 0,
          ratingCount: 0,
          favoriteCount: 0,
          lastAddedAt: game.createdAt,
          entries: [],
        };
        map.set(key, group);
      }

      group.imageUrl = group.imageUrl || game.imageUrl || null;
      group.description = group.description || game.description || null;
      game.genres.forEach((g: string) =>
        group.genreCounts.set(g, (group.genreCounts.get(g) || 0) + 1),
      );
      group.users.add(game.userId);
      if (game.rating) {
        group.ratingSum += game.rating;
        group.ratingCount += 1;
      }
      if (game.favorite) group.favoriteCount += 1;
      if (game.createdAt > group.lastAddedAt) group.lastAddedAt = game.createdAt;
      group.entries.push(game);
    }

    return Array.from(map.values()).map((g) => ({
      key: g.key,
      name: g.name,
      imageUrl: g.imageUrl,
      description: g.description,
      genres: Array.from(g.genreCounts.entries())
        .sort((a: any, b: any) => b[1] - a[1])
        .map((e: any) => e[0]),
      playerCount: g.users.size,
      ratingCount: g.ratingCount,
      avgRating: g.ratingCount ? Math.round((g.ratingSum / g.ratingCount) * 10) / 10 : null,
      favoriteCount: g.favoriteCount,
      lastAddedAt: g.lastAddedAt,
      entries: g.entries,
    }));
  }

  private summary(group: CatalogGroup) {
    const { entries, ...rest } = group;
    return rest;
  }

  async catalog(q?: string, genre?: string, sort = 'popular') {
    let groups = await this.loadGroups();

    const term = (q || '').trim().toLowerCase();
    if (term) groups = groups.filter((g) => g.key.includes(term));

    const wanted = (genre || '').trim().toLowerCase();
    if (wanted) groups = groups.filter((g) => g.genres.some((x) => x.toLowerCase() === wanted));

    const byPopular = (a: CatalogGroup, b: CatalogGroup) =>
      b.playerCount - a.playerCount || (b.avgRating || 0) - (a.avgRating || 0);

    if (sort === 'rating') {
      groups.sort(
        (a, b) => (b.avgRating || 0) - (a.avgRating || 0) || b.ratingCount - a.ratingCount,
      );
    } else if (sort === 'recent') {
      groups.sort((a, b) => +new Date(b.lastAddedAt) - +new Date(a.lastAddedAt));
    } else if (sort === 'name') {
      groups.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      groups.sort(byPopular);
    }

    return { total: groups.length, items: groups.slice(0, 60).map((g) => this.summary(g)) };
  }

  async catalogDetail(name: string) {
    const key = keyOf(name);
    const groups = await this.loadGroups();
    const group = groups.find((g) => g.key === key);
    if (!group) throw new NotFoundException('Jogo não encontrado na comunidade');

    const distribution = [0, 0, 0, 0, 0];
    group.entries.forEach((e) => {
      if (e.rating >= 1 && e.rating <= 5) distribution[e.rating - 1] += 1;
    });

    const entries = group.entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      user: e.user,
      platform: e.platform,
      status: e.status,
      rating: e.rating,
      review: e.review,
      hoursPlayed: e.hoursPlayed,
      favorite: e.favorite,
      createdAt: e.createdAt,
    }));

    return { ...this.summary(group), distribution, entries };
  }

  async home() {
    const groups = await this.loadGroups();

    const popular = [...groups]
      .sort((a, b) => b.playerCount - a.playerCount || (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, 6)
      .map((g) => this.summary(g));

    const topRated = groups
      .filter((g) => g.ratingCount > 0)
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0) || b.ratingCount - a.ratingCount)
      .slice(0, 6)
      .map((g) => this.summary(g));

    const allEntries = groups.flatMap((g) => g.entries);
    const toActivity = (e: any) => ({
      id: e.id,
      name: e.name,
      imageUrl: e.imageUrl,
      rating: e.rating,
      review: e.review,
      status: e.status,
      createdAt: e.createdAt,
      user: e.user,
    });

    const recentReviews = allEntries
      .filter((e) => e.review && e.review.trim())
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5)
      .map(toActivity);

    const [userCount, newUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { ...USER_PREVIEW, bio: true, _count: { select: { games: true } } },
      }),
    ]);

    return {
      stats: {
        users: userCount,
        games: allEntries.length,
        uniqueGames: groups.length,
        reviews: allEntries.filter((e) => e.review && e.review.trim()).length,
      },
      popular,
      topRated,
      recentReviews,
      newUsers: newUsers.map((u: any) => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        gameCount: u._count.games,
      })),
    };
  }

  // Atividade recente de quem o usuário segue
  async feed(userId: string) {
    const id = Number(userId);
    if (!id) return [];

    const follows = await this.prisma.follow.findMany({
      where: { followerId: id },
      select: { followingId: true },
    });
    const ids = follows.map((f) => f.followingId);
    if (ids.length === 0) return [];

    const games = await this.prisma.game.findMany({
      where: { userId: { in: ids } },
      include: { user: { select: USER_PREVIEW } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return games.map((g: any) => ({
      id: g.id,
      name: g.name,
      imageUrl: g.imageUrl,
      rating: g.rating,
      review: g.review,
      status: g.status,
      createdAt: g.createdAt,
      user: g.user,
    }));
  }

  // ---------- Steam ----------

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

  private mapGenres(
    steamGenres: { description: string }[] = [],
    categories: { description: string }[] = [],
  ): string[] {
    const dictionary: Record<string, string> = {
      action: 'Ação',
      adventure: 'Aventura',
      rpg: 'RPG',
      strategy: 'Estratégia',
      simulation: 'Simulação',
      sports: 'Esporte',
      racing: 'Corrida',
      casual: 'Puzzle',
      indie: 'Indie',
      'massively multiplayer': 'Multijogador',
    };

    const found = new Set<string>();
    steamGenres.forEach((g) => {
      const name = (g.description || '').toLowerCase();
      Object.keys(dictionary).forEach((k) => {
        if (name.includes(k)) found.add(dictionary[k]);
      });
    });

    categories.forEach((c) => {
      const name = (c.description || '').toLowerCase();
      if (name.includes('multi-player') || name.includes('co-op') || name.includes('pvp')) {
        found.add('Multijogador');
      }
    });

    return found.size ? Array.from(found) : ['Outro'];
  }

  private async fetchApp(appid: string, lang: string) {
    try {
      const res = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appid}&l=${lang}`,
      );
      const data = await res.json();
      const entry = data?.[appid];
      return entry?.success ? entry.data : null;
    } catch (err) {
      return null;
    }
  }

  async getExternalDetails(appid: string) {
    if (!appid) return null;

    // Gêneros vêm em inglês (mapeados pra nossa lista); a descrição vem em português quando existe.
    const [en, pt] = await Promise.all([
      this.fetchApp(appid, 'english'),
      this.fetchApp(appid, 'brazilian'),
    ]);
    const info = en || pt;
    if (!info) return null;

    const genres = this.mapGenres(info.genres, info.categories);

    return {
      genres,
      genre: genres[0],
      description: decodeEntities(pt?.short_description || info.short_description || ''),
      image: info.header_image || null,
    };
  }
}
