import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard'; 

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard) // Triggers LocalStrategy and AuthService.validateUser
  @Post('login')
  async login(@Request() req) {
    // req.user is populated after successful validation by the guard
    return this.authService.login(req.user);
  }
}