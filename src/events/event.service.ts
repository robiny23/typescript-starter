import { Injectable } from '@nestjs/common';
import { Event } from './event.entity'; 
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
    ) {}

    // find all events
    findAll(): Promise<Event[]> {
        return this.eventRepository.find();
    }

    // Create a new event
    async create(eventData: Partial<Event>): Promise<Event> {
        const newEvent = this.eventRepository.create(eventData);
        return this.eventRepository.save(newEvent);
    }

    // Retrieve an event by its ID
    findById(id: number): Promise<Event> {
        return this.eventRepository.findOne({ where: { id: id } });
    }

    // Delete an event by its ID
    deleteById(id: number): Promise<void> {
        return this.eventRepository.delete(id).then(() => {});
    }

    async mergeAll(userId: number): Promise<Event[]> {
        // 1. Fetch all events for the user, sorted by start time.
        const events = await this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.invitees', 'user')
            .where('user.id = :userId', { userId })
            .orderBy('event.startTime', 'ASC')
            .getMany();
            
        if (!events.length) {
            return null; // No events for this user.
        }
    
        let mergedEvents = [];
        let currentEvent = events[0];
    
        // 2. Iterate through the events and detect overlaps.
        for (let i = 1; i < events.length; i++) {
            if (currentEvent.endTime >= events[i].startTime) {
                // Overlap detected
    
                // 3. Merge overlapping events.
                currentEvent.endTime = new Date(Math.max(currentEvent.endTime.getTime(), events[i].endTime.getTime()));

                // Combine invitees, removing duplicates.
                currentEvent.invitees = Array.from(
                    new Set([...currentEvent.invitees, ...events[i].invitees])
                );
            } else {
                // No overlap
                mergedEvents.push(currentEvent);
                currentEvent = events[i];
            }
        }
        mergedEvents.push(currentEvent);
    
        // 4. Save merged events and delete original events.
        for (let event of events) {
            await this.eventRepository.remove(event);
        }
    
        for (let mergedEvent of mergedEvents) {
            await this.eventRepository.save(mergedEvent);
        }
    
        return mergedEvents;
    }
    
    
}


