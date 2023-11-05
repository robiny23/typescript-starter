import { Controller, Get, Post, Param, Delete, Body } from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto'; // DTO import

@Controller('events') // set api routes
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Get()
    findAll(): Promise<Event[]> {
        return this.eventService.findAll();
    }
/*
    @Post()
    create(@Body() eventData: Partial<Event>): Promise<Event> {
        return this.eventService.create(eventData);
    }
*/

    @Post()
    create(@Body() createEventDto: CreateEventDto): Promise<Event> {
        return this.eventService.create(createEventDto);
    }
    @Get(':id')
    async findById(@Param('id') id: number): Promise<Event> {
        return await this.eventService.findById(id);
    }

    @Delete('delete/:id')
    async deleteById(@Param('id') id: number): Promise<{ deleted: boolean; id?: number }> {
        return this.eventService.deleteById(id);
    }


    @Post('mergeAll/:userId')
    async mergeAll(@Param('userId') userId: number): Promise<Event[]> {
        return this.eventService.mergeAll(userId);
    }

    /*
    @Post(':eventId/invitees/:userId')
    async addInviteeToEvent(
        @Param('eventId') eventId: number,
        @Param('userId') userId: number
    ) {
        return this.eventService.addInvitee(eventId, userId);
    }

    @Delete(':eventId/invitees/:userId')
    async removeInviteeFromEvent(
        @Param('eventId') eventId: number,
        @Param('userId') userId: number
    ) {
        return this.eventService.removeInvitee(eventId, userId);
    }
*/
}
