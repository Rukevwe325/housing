import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service'; 

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Called by the LocalStrategy to validate credentials.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    
    // Check user existence and password hash comparison
    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      return null;
    }
    
    // Extract the hash and return the rest of the user object
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Generates a JWT and returns user details upon successful login.
   */
  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      // 🎯 Return the profile data so the frontend can use it immediately
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    };
  }
}