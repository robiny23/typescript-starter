import { Injectable, NotFoundException } from '@nestjs/common';
import { Event } from './event.entity';
import { Repository, FindOneOptions, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../users/user.service';
import { CreateEventDto } from './dto/create-event.dto'
@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>, 
        private userService: UserService,
    ) { }

    // find all events
    findAll(): Promise<Event[]> {
        return this.eventRepository.find();
    }

    // Create a new event
    async create(eventData: CreateEventDto): Promise<Event> {
        // Create a new instance of the event
        const event = this.eventRepository.create({
            ...eventData,
            invitees: undefined, //to be set separately
        });
        
        let invitees = [];

        // If invitees are provided, retrieve and set them
        if (eventData.invitees && eventData.invitees.length > 0) {
            invitees = await this.userService.findUsersByIds(eventData.invitees);
            event.invitees = invitees;
        }
        const savedEvent = await this.eventRepository.save(event)
        // Ensure startTime and endTime are Date objects
        const startTime = new Date(savedEvent.startTime);
        const endTime = new Date(savedEvent.endTime);

        // Format event string with ID and time
        const formattedStartTime = startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
        const formattedEndTime = endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
        const eventString = `${savedEvent.id} ${savedEvent.title}: ${formattedStartTime}-${formattedEndTime}`;

        // Update each invitee's user events list with the new event string
        for (const invitee of savedEvent.invitees) {
            await this.userService.addEventToUser(invitee.id, eventString);
        }
        console.log(`Event with ID ${savedEvent.id} created.`);
        return savedEvent;
    }

    // Retrieve an event by its ID
    async findById(id: number, options?: FindOneOptions<Event>): Promise<Event | null> {

        // Pass the options directly to the findOne method
        const event = await this.eventRepository.findOne({ where: { id: id }, ...options });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found.`);
        }
        return event;

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

        let mergedEvents: Event[] = [];
        let eventsToDelete: Event[] = [];

        for (let i = 0; i < userEvents.length; i++) {
            //console.log(`Event ${i} invitees:`, userEvents[i].invitees);
            for (let j = i + 1; j < userEvents.length; j++) {
                // Check for overlap
                if (userEvents[i].endTime > userEvents[j].startTime) {
                    console.log(`Overlap detected, merging events with IDs: ${userEvents[i].id} and ${userEvents[j].id}`);

                    const allInvitees = Array.from(new Set([...userEvents[i].invitees, ...userEvents[j].invitees]));

                    // Create new merged event object
                    const newMergedEvent = new Event(); // Assuming Event is a class with a constructor
                    newMergedEvent.startTime = new Date(Math.min(userEvents[i].startTime.getTime(), userEvents[j].startTime.getTime()));
                    newMergedEvent.endTime = new Date(Math.max(userEvents[i].endTime.getTime(), userEvents[j].endTime.getTime()));
                    newMergedEvent.invitees = allInvitees;
                    //console.log(allInvitees, newMergedEvent.invitees);
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
            //console.log(`Deleting event ID: ${event.id}`);
            await this.deleteById(event.id);
        }

        console.log('Merge process completed.');
        return mergedEvents;
    }



    private mergedEventToDTO(mergedEvent: Event): CreateEventDto {
        // Convert Event entity to the CreateEventDto format required by the create method.
        const { id, ...eventDataWithoutId } = mergedEvent;

        return {
            ...eventDataWithoutId,
            title: mergedEvent.title || 'E_merged',
            invitees: mergedEvent.invitees.map(invitee => invitee.id),

            // Include any other transformations needed to match the DTO structure
        };
    }

}


