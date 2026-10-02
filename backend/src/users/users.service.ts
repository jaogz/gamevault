import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PUBLIC_FIELDS = {
  id: true,
  username: true,
  avatarUrl: true,
  coverUrl: true,
  bio: true,
  location: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException('Esse nome de usuário já está em uso');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { username: dto.username, password: hashed },
    });

    return { id: user.id, username: user.username };
  }

  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) {
      throw new UnauthorizedException('Usuário ou senha incorretos');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Usuário ou senha incorretos');
    }

    return { id: user.id, username: user.username };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: { ...PUBLIC_FIELDS, _count: { select: { games: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      coverUrl: u.coverUrl,
      bio: u.bio,
      location: u.location,
      createdAt: u.createdAt,
      gameCount: u._count.games,
    }));
  }

  async findOne(id: number, viewerId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...PUBLIC_FIELDS,
        _count: { select: { games: true, followers: true, following: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    let isFollowing = false;
    if (viewerId && viewerId !== id) {
      const rel = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: id } },
      });
      isFollowing = !!rel;
    }

    const { _count, ...rest } = user as any;
    return {
      ...rest,
      gameCount: _count.games,
      followersCount: _count.followers,
      followingCount: _count.following,
      isFollowing,
    };
  }

  async follow(followingId: number, followerId: number) {
    if (followingId === followerId) {
      throw new BadRequestException('Você não pode seguir a si mesmo');
    }
    await this.findOne(followingId);
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
    return this.findOne(followingId, followerId);
  }

  async unfollow(followingId: number, followerId: number) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return this.findOne(followingId, followerId);
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: PUBLIC_FIELDS,
    });
  }
}
