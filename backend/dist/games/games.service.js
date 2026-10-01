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
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GamesService = class GamesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto) {
        return this.prisma.game.create({ data: dto });
    }
    findAll(userId) {
        const where = userId ? { userId: Number(userId) } : {};
        return this.prisma.game.findMany({ where, orderBy: { createdAt: 'desc' } });
    }
    async findOne(id) {
        const game = await this.prisma.game.findUnique({ where: { id } });
        if (!game)
            throw new common_1.NotFoundException('Jogo não encontrado');
        return game;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.game.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.game.delete({ where: { id } });
    }
    async searchExternal(query) {
        if (!query || query.trim().length < 2)
            return [];
        const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            return (data.items || []).slice(0, 8).map((item) => ({
                appid: item.id,
                name: item.name,
                image: item.tiny_image,
            }));
        }
        catch (err) {
            return [];
        }
    }
    mapGenre(steamGenres = []) {
        const names = steamGenres.map((g) => g.description.toLowerCase());
        if (names.some((n) => n.includes('rpg')))
            return 'RPG';
        if (names.some((n) => n.includes('action')))
            return 'Ação';
        if (names.some((n) => n.includes('adventure')))
            return 'Aventura';
        if (names.some((n) => n.includes('strategy')))
            return 'Estratégia';
        if (names.some((n) => n.includes('casual') || n.includes('puzzle')))
            return 'Puzzle';
        if (names.some((n) => n.includes('sports') || n.includes('racing')))
            return 'Esporte';
        return 'Outro';
    }
    async getExternalDetails(appid) {
        if (!appid)
            return null;
        const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            const entry = data?.[appid];
            if (!entry?.success)
                return null;
            const info = entry.data;
            return {
                genre: this.mapGenre(info.genres),
                description: info.short_description || '',
                image: info.header_image || null,
            };
        }
        catch (err) {
            return null;
        }
    }
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GamesService);
