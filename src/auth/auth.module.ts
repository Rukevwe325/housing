// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'; 
import { ConfigModule, ConfigService } from '@nestjs/config';
import ms = require('ms');
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import UsersModule from '../users/users.module'; 
import { LocalStrategy } from './strategies/local.strategy';
// 🟢 NEW: Import the JwtStrategy
import { JwtStrategy } from './strategies/jwt.strategy'; 

@Module({
  imports: [
    UsersModule, 
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => { 
        
        const expiresInStr = configService.get<string>('JWT_EXPIRATION_TIME') || '1h'; 
        
        // 1. Convert the duration string (e.g., '1h') to milliseconds (e.g., 3600000).
        const expiresInMs = ms(expiresInStr as any); 

        // 2. Default to 1 hour (3600000ms) if ms() returns undefined (invalid string).
        const safeExpiresInMs = (expiresInMs === undefined || expiresInMs === null)
          ? 3600000 
          : expiresInMs;
        
        return {
          secret: configService.get<string>('JWT_SECRET') || 'A_VERY_STRONG_FALLBACK_SECRET',
          signOptions: { 
            // Ensure the value is a guaranteed JavaScript Number.
            expiresIn: Number(safeExpiresInMs), 
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    LocalStrategy,
    // 🟢 FIX: Register the JwtStrategy here!
    JwtStrategy,
],
  exports: [AuthService, JwtModule],
})
export default class AuthModule {}