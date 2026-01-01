import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // UPDATED CORS CONFIGURATION
  app.enableCors({
    origin: (origin, callback) => {
      // List of allowed origins
      const allowedOrigins = [
        'http://localhost:3000',
        'http://10.56.44.249:3000',
        'http://10.56.44.249',
        'http://localhost',
        'https://dconnect-six.vercel.app',
        'capacitor://localhost',
        'http://localhost:5173', // Adding default Vite port just in case
      ];

      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(null, true); // For debugging, you can set this to true to allow everything
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const port = process.env.PORT ?? 4000;

  // Listen on 0.0.0.0 to accept connections from the network
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Backend running on port ${port}`);
  logger.log(`🔗 Local: http://localhost:${port}`);
  logger.log(`🔗 Network: http://10.56.44.249:${port}`);
}

bootstrap();