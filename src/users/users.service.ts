import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity'; // Your existing entity
import { CreateUserDto } from './dto/create-user.dto'; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Used for Registration API (future)
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName } = createUserDto;

    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email address is already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = this.usersRepository.create({
      email,
      firstName,
      lastName,
      passwordHash,
      authStrategy: 'local',
    });

    return this.usersRepository.save(newUser);
  }

  /**
   * CRITICAL METHOD FOR LOGIN: Finds user and explicitly selects the passwordHash.
   * Return type changed from 'User | undefined' to 'User | null' to fix TS2322.
   */
  async findOneByEmail(email: string): Promise<User | null> { // 👈 **FIX IS HERE**
    return this.usersRepository.findOne({ 
      where: { email },
      // ⚠️ We MUST explicitly select passwordHash here because we set select: false in the entity!
      select: ['id', 'email', 'passwordHash', 'role', 'firstName', 'lastName'] 
    });
  }
}