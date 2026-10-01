"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, express_1.json)({ limit: '8mb' }));
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true }));
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`Backend rodando na porta ${port}`);
}
bootstrap();
