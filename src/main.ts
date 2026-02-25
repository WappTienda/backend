import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security headers
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(helmet());

  // Global prefix
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigins = configService.get<string[]>('cors.origins', [
    'http://localhost:3001',
  ]);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (configService.get('nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WhatsApp eCommerce API')
      .setDescription('Backend API for WhatsApp-based eCommerce')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('port', 3000);
  await app.listen(port);
  console.log(
    `🚀 Application running on: http://localhost:${port}/${apiPrefix}`,
  );
  console.log(`📚 API Docs available at: http://localhost:${port}/docs`);
}
void bootstrap();
