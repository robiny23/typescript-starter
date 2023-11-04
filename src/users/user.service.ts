import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { EventService } from '../events/event.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private userRepository: Repository<User>,
        private readonly eventService: EventService,
    ) {}

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    findOne(id: number): Promise<User> {
        return this.usersRepository.findOne({ where: { id: id } });
    }

    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }

    async getMergedEventStringsForUser(userId: number): Promise<string[]> {
        const mergedEvents = await this.eventService.mergeAll(userId);
        // Convert mergedEvents to a list of their IDs as strings
        const eventStrings = mergedEvents.map(event => `${event.title}: ${event.startTime} - ${event.endTime}`);
        return eventStrings;
    }

    async mergeEventsAndAssignToUser(userId: number): Promise<User> {
        // Retrieve the user by ID
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
          throw new Error('User not found');
        }
    
        // Merge events and get an array of event ID strings
        const mergedEventStrings = await this.getMergedEventStringsForUser(userId);
    
        // Update the user's events property
        user.events = mergedEventStrings;
    
        // Save the updated user to the database
        await this.userRepository.save(user);
    
        // Return the updated user
        return user;
    }
}
