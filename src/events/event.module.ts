import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { UserModule } from '../users/user.module'; // Import UserModule


@Module({
  imports: [
    TypeOrmModule.forFeature([Event]), 
    UserModule, // Import UserModule
  ],
  providers: [EventService], 
  exports: [EventService], 
})
export class EventModule {}