import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Comandos idempotentes: podem rodar a cada inicialização sem estragar nada.
// Eles deixam o banco (Neon) igual ao schema.prisma da versão 2, mesmo que o
// Build Command da Render não tenha rodado "prisma db push".
const SCHEMA_STATEMENTS = [
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "genres" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "fromCatalog" BOOLEAN NOT NULL DEFAULT false`,
  `CREATE TABLE IF NOT EXISTS "Follow" (
     "followerId" INTEGER NOT NULL,
     "followingId" INTEGER NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId", "followingId")
   )`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Follow_followerId_fkey') THEN
       ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey"
         FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Follow_followingId_fkey') THEN
       ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey"
         FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
   END $$`,
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  schemaReady = false;
  schemaError: string | null = null;

  async onModuleInit() {
    await this.$connect();
    await this.ensureSchema();
  }

  async ensureSchema() {
    try {
      for (const sql of SCHEMA_STATEMENTS) {
        await this.$executeRawUnsafe(sql);
      }
      this.schemaReady = true;
      this.schemaError = null;
      this.logger.log('Banco sincronizado com o schema da versão 2.');
    } catch (err: any) {
      this.schemaReady = false;
      this.schemaError = String(err?.message || err).slice(0, 400);
      this.logger.error(`Não consegui ajustar o banco: ${this.schemaError}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
