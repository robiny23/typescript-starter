import { Injectable, NotFoundException } from '@nestjs/common';
import { Event } from './event.entity'; 
import { Repository, FindOneOptions, DataSource, In } from 'typeorm';
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
        private dataSource: DataSource,
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
        let invitees = [];
        
        // If invitees are provided, we need to retrieve and set them
        if (eventData.invitees && eventData.invitees.length > 0) {
            invitees = await this.userService.findUsersByIds(eventData.invitees);
            //console.log('Fetched invitee entities:', invitees); // Log the fetched invitee entities
            event.invitees = invitees;
            
            // Add this event to each user's events: string[]
            
        }
        const savedEvent = await this.eventRepository.save(event)
        for (const user of invitees) {
                await this.userService.addEventToUser(user.id, savedEvent.id);
            }
        return savedEvent;
    }

    // Retrieve an event by its ID
    async findById(id: number, options?: FindOneOptions<Event>): Promise<Event | null> {
        try {
            // Pass the options directly to the findOne method
            const event = await this.eventRepository.findOne({ where: { id: id }, ...options });
            if (!event) {
                console.log(`Event with ID ${id} not found.`);
                return null;
            }
            return event;
        } catch (error) {
            console.error(`An error occurred while retrieving event with ID ${id}:`, error);
            throw new Error('Unable to retrieve event.');
        }
    }
    

    // Delete an event by its ID
    async deleteById(id: number): Promise<{ deleted: boolean; id?: number }> {
        const event = await this.findById(id, { relations: ['invitees'] });
        if (!event) {
            return { deleted: false };
        }
    
        // Remove event from each user's list
        if (event.invitees && event.invitees.length > 0) {
            await Promise.all(event.invitees.map(user => 
                this.userService.removeEventFromUser(user.id, id)
            ));
        }
    
        await this.eventRepository.delete(id);
        console.log(`Event with ID ${id} deleted.`);
        return { deleted: true, id };
    }
    
    async mergeAll(userId: number): Promise<Event[]> {
        console.log(`Starting mergeAll for user ID: ${userId}`);
        // Filter out events that do not include the user.
        const userEvents = await this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.invitees', 'invitee') // Left join to get all invitees
            .where('event.id IN ' + 
                   '(SELECT event.id FROM event ' +
                   'LEFT JOIN event_invitees_user ON event_invitees_user.event_Id = event.id ' +
                   'WHERE event_invitees_user.user_Id = :userId)', 
                   { userId }) // Subquery to filter only events where the user is an invitee
            .orderBy('event.startTime', 'ASC')
            .getMany();

    
            for (const event of userEvents) {
                console.log({
                  ...event,
                  invitees: event.invitees.map(invitee => ({
                    id: invitee.id,
                    name: invitee.name, // Assuming 'name' is a field you want to log
                    // Add any other fields you want to see from the User entity
                  })),
                });
              }
        
        let mergedEvents: Event[] = [];
        let eventsToDelete: Event[] = [];
    
        for (let i = 0; i < userEvents.length; i++) {
            //console.log(`Event ${i} invitees:`, userEvents[i].invitees);
            for (let j = i + 1; j < userEvents.length; j++) {
                // Check for overlap
                if (userEvents[i].endTime > userEvents[j].startTime) {
                    console.log(`Overlap detected, merging events with IDs: ${userEvents[i].id} and ${userEvents[j].id}`);
                    
                    // Collect all unique invitees from both events
                    console.log(`Event ${i} invitees:`, userEvents[i].invitees);
                    console.log(`Event ${j} invitees:`, userEvents[j].invitees);

                    const allInvitees = Array.from(new Set([...userEvents[i].invitees, ...userEvents[j].invitees]));

                    console.log(`All combined invitees:`, allInvitees);

                    // Create new merged event object
                    const newMergedEvent = new Event(); // Assuming Event is a class with a constructor
                    newMergedEvent.startTime = new Date(Math.min(userEvents[i].startTime.getTime(), userEvents[j].startTime.getTime()));
                    newMergedEvent.endTime = new Date(Math.max(userEvents[i].endTime.getTime(), userEvents[j].endTime.getTime()));
                    newMergedEvent.invitees = allInvitees;
                    console.log(allInvitees, newMergedEvent.invitees);
                    // Save the merged event
                    const savedMergedEvent = await this.create(this.mergedEventToDTO(newMergedEvent));
                    mergedEvents.push(savedMergedEvent);
    
                    // Mark old events for deletion
                    eventsToDelete.push(userEvents[i], userEvents[j]);
    
                    // Avoid double processing
                    i = j; // Skip to the event after j for the next iteration of i
                    break; // Exit the inner loop
                }
            }
        }
    
        // Delete old events that were merged
        for (let event of eventsToDelete) {
            console.log(`Deleting event ID: ${event.id}`);
            await this.deleteById(event.id);
        }
        
        console.log('Merge process completed.');
        return mergedEvents;
    }
    
    
      
    private mergedEventToDTO(mergedEvent: Event): CreateEventDto {
        // Convert your Event entity to the CreateEventDto format required by the create method.
        // This is pseudocode and will depend on your actual CreateEventDto structure.
        const { id, ...eventDataWithoutId } = mergedEvent;
        console.log(mergedEvent.invitees.map(invitee => invitee.id));
        // Now eventDataWithoutId does not contain the ID.
        return {
          ...eventDataWithoutId,
          title: mergedEvent.title || 'E_merged',
          invitees: mergedEvent.invitees.map(invitee => invitee.id),
          
          // Include any other transformations needed to match the DTO structure
        };
    }
    
 /*       
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
*/
    
}


