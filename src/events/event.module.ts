import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],  // This ensures the repository for Event is available for dependency injection
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
