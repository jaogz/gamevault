import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { GamesModule } from './games/games.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';

@Module({
  imports: [PrismaModule, GamesModule, UsersModule],
  controllers: [AppController],
})
export class AppModule {}
