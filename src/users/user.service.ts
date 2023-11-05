import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Event } from '../events/event.entity';
import { EventService } from '../events/event.service';
import { CreateUserDto } from './dto/create-user.dto'; // DTO import

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        
        //@InjectRepository(Event)
        //private eventRepository: Repository<Event>,
        //private readonly eventService: EventService,
    ) {}

    findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    findOne(id: number): Promise<User> {
        return this.userRepository.findOne({ where: { id: id } });
    }

    async findUsersByIds(ids: number[]): Promise<User[]> {
        return this.userRepository.createQueryBuilder("user")
          .where("user.id IN (:...ids)", { ids })
          .getMany();
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const user = new User();
        user.name = createUserDto.name;
        user.events = []; // Set an empty array by default
        console.log(`User with name ${createUserDto.name} created.`);
        return this.userRepository.save(user);
    }
    

    async remove(id: number): Promise<void> {
        await this.userRepository.delete(id);
        console.log(`User with ID ${id} deleted.`);
    }

    async save(user: User): Promise<User> {
        return this.userRepository.save(user);
    }
/*
    async addEventToUser(userId: number, eventId: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
    
        const event = await this.eventRepository.findOneBy({ id: eventId });
        if (!event) {
          throw new NotFoundException(`Event with ID ${eventId} not found`);
        }
    
        user.invitedEvents = Array.isArray(user.invitedEvents) ? [...user.invitedEvents, event] : [event];
        await this.userRepository.save(user);
        return user;
    }
    
    async removeEventFromUser(userId: number, eventId: number): Promise<User> {
        const user = await this.userRepository.findOne({
          where: { id: userId },
          relations: ['invitedEvents']
        });
    
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
    
        const eventIndex = user.invitedEvents.findIndex(e => e.id === eventId);
        if (eventIndex === -1) {
          throw new NotFoundException(`Event with ID ${eventId} not associated with user ID ${userId}`);
        }
    
        user.invitedEvents.splice(eventIndex, 1);
        await this.userRepository.save(user);
        return user;
    }
    */
}
