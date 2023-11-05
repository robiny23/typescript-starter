import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity'; 

@Module({
    imports: [
      TypeOrmModule.forFeature([User]), // repository for User entity
    ],
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService] 
  })
export class UserModule {}
