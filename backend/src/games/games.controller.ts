import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.gamesService.findAll(userId);
  }

  // Precisam vir ANTES de @Get(':id'), senão seriam interpretadas como um id.
  @Get('search-external')
  searchExternal(@Query('q') q: string) {
    return this.gamesService.searchExternal(q);
  }

  @Get('external-details')
  getExternalDetails(@Query('appid') appid: string) {
    return this.gamesService.getExternalDetails(appid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gamesService.remove(+id);
  }
}
