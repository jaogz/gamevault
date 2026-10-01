"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const PUBLIC_FIELDS = {
    id: true,
    username: true,
    avatarUrl: true,
    coverUrl: true,
    bio: true,
    location: true,
    createdAt: true,
};
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (existing) {
            throw new common_1.BadRequestException('Esse nome de usuário já está em uso');
        }
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: { username: dto.username, password: hashed },
        });
        return { id: user.id, username: user.username };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário ou senha incorretos');
        }
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Usuário ou senha incorretos');
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
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: PUBLIC_FIELDS,
        });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return user;
    }
    async updateProfile(id, dto) {
        await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: PUBLIC_FIELDS,
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
