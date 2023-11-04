import { Controller, Get } from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './event.entity';
import { Post, Param, Delete, Body } from '@nestjs/common';

@Controller('events') // This means all routes in this controller will start with "/events"
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Get()
    findAll(): Promise<Event[]> {
        return this.eventService.findAll();
    }

    @Post()
    create(@Body() eventData: Partial<Event>): Promise<Event> {
        return this.eventService.create(eventData);
    }

    @Get(':id')
    findById(@Param('id') id: number): Promise<Event> {
        return this.eventService.findById(id);
    }

    @Delete(':id')
    deleteById(@Param('id') id: number): Promise<void> {
        return this.eventService.deleteById(id);
    }

    @Post('mergeAll/:userId')
    async mergeAll(@Param('userId') userId: number): Promise<Event[]> {
        return this.eventService.mergeAll(userId);
    }
}
