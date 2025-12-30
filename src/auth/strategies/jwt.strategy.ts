// src/auth/strategies/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    // 🟢 FIX: Call super() first. We need to define the secret before calling super,
    // but without accessing 'this' directly until after super() returns.
    // We move the ConfigService logic into the super call arguments.

    // Calculate the secret using configService which is provided as an argument.
    const secret = configService.get<string>('JWT_SECRET')!; 
    
    // 1. Call super() immediately.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // 2. Pass the calculated secret key
    });
  }

  async validate(payload: any) {
    // After super() is called, we can now access 'this' and its properties if needed.
    return { id: payload.sub, email: payload.email }; 
  }
}