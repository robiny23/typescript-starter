import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { UserModule } from '../users/user.module'; // Import UserModule


@Module({
  imports: [
    TypeOrmModule.forFeature([Event]), // This will provide the repository for the Event entity.
    UserModule, // Import UserModule
  ],
  providers: [EventService], // EventService should be provided here.
  exports: [EventService], // Export EventService if it's used outside of this module.
})
export class EventModule {}