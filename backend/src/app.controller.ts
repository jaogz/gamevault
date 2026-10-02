import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  // Abrir o endereço do backend no navegador mostra se a versão 2 está no ar
  // e se o banco está sincronizado.
  @Get()
  status() {
    return {
      app: 'GameVault API',
      version: 2,
      schemaReady: this.prisma.schemaReady,
      schemaError: this.prisma.schemaError,
    };
  }
}
