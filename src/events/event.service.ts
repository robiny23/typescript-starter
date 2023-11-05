import { Injectable, NotFoundException } from '@nestjs/common';
import { Event } from './event.entity'; 
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import {CreateEventDto} from './dto/create-event.dto'
@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>, // This is the correct way to inject.
        private userService: UserService,
    ) {}

    // find all events
    findAll(): Promise<Event[]> {
        return this.eventRepository.find();
    }

    // Create a new event
    async create(eventData: CreateEventDto): Promise<Event> {
        // Create a new instance of the event
        const event = this.eventRepository.create({
            ...eventData,
            invitees: undefined, // We will set this separately
        });
        //console.log('Received invitee IDs:', eventData.invitees); // Log the received invitee IDs
      
        // If invitees are provided, we need to retrieve and set them
        if (eventData.invitees && eventData.invitees.length > 0) {
            const invitees = await this.userService.findUsersByIds(eventData.invitees);
            //console.log('Fetched invitee entities:', invitees); // Log the fetched invitee entities
            event.invitees = invitees;
            
            /*
            // Add this event to each user's invitedEvents
            for (const user of invitees) {
                if (!user.invitedEvents) {
                user.invitedEvents = [];
                }
                user.invitedEvents.push(event);
                await this.userService.save(user); // Assuming there's a save method in userService
            }
            */
        }
        
        return await this.eventRepository.save(event);
    }

    // Retrieve an event by its ID
    async findById(id: number): Promise<Event | null> {
        try {
            const event = await this.eventRepository.findOne({ where: { id: id } });
            if (!event) {
                // You can throw an error or simply return null to indicate not found
                console.log(`Event with ID ${id} not found.`);
                return null;
            }
            // Optionally, perform any additional processing on the event before returning
            return event;
        } catch (error) {
            // Handle or log the error as needed
            console.error(`An error occurred while retrieving event with ID ${id}:`, error);
            throw new Error('Unable to retrieve event.');
        }
    }
    

    // Delete an event by its ID
    async deleteById(id: number): Promise<{ deleted: boolean; id?: number }> {
        const event = await this.findById(id);
        if (!event) {
            return { deleted: false };
        }

        await this.eventRepository.delete(id);
        console.log(`Event with ID ${id} deleted.`);
        return { deleted: true, id };
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
        
    async addInvitee(eventId: number, userId: number): Promise<void> {
        const event = await this.eventRepository.findOne({ where: { id: eventId }, relations: ['invitees'] });
        const user = await this.userService.findOne(userId);

        if (!event || !user) {
            throw new NotFoundException('Event or User not found');
        }

        // Add the user to the event's invitees if not already invited
        if (!event.invitees.some(invitee => invitee.id === user.id)) {
            event.invitees.push(user);
            await this.eventRepository.save(event);
        }
    }

    async removeInvitee(eventId: number, userId: number): Promise<void> {
        const event = await this.eventRepository.findOne({ where: { id: eventId }, relations: ['invitees'] });
        const user = await this.userService.findOne(userId);

        if (!event || !user) {
            throw new NotFoundException('Event or User not found');
        }

        // Remove the user from the event's invitees
        event.invitees = event.invitees.filter(invitee => invitee.id !== user.id);
        await this.eventRepository.save(event);
    }


    async getMergedEventStringsForUser(userId: number): Promise<string[]> {
        const mergedEvents = await this.mergeAll(userId);
        // Convert mergedEvents to a list of their IDs as strings
        const eventStrings = mergedEvents.map(event => `${event.title}: ${event.startTime} - ${event.endTime}`);
        return eventStrings;
    }

    async mergeEventsAndAssignToUser(userId: number): Promise<User> {
        // Retrieve the user by ID
        const user = await this.userService.findOne(userId);
        if (!user) {
          throw new Error('User not found');
        }
    
        // Merge events and get an array of event ID strings
        const mergedEventStrings = await this.getMergedEventStringsForUser(userId);
    
        // Update the user's events property
        user.events = mergedEventStrings;
    
        // Save the updated user to the database
        await this.userService.save(user);
    
        // Return the updated user
        return user;
    }
    
}


