import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto'; 
import { User } from './entities/user.entity';

@Controller('users') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register') 
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
  async register(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.create(createUserDto);
    
    // Remove hash before sending response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result as Omit<User, 'passwordHash'>;
  }
}