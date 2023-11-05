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

    async addEventToUser(userId: number, eventId: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }
    
        // Add event ID as a string to the user's events array
        user.events = Array.isArray(user.events) ? [...user.events, eventId.toString()] : [eventId.toString()];
        await this.userRepository.save(user);
        return user;
    }
    
    
    async removeEventFromUser(userId: number, eventId: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }
    
        // Remove event ID as a string from the user's events array
        user.events = user.events.filter(eventIdStr => eventIdStr !== eventId.toString());
        await this.userRepository.save(user);
        return user;
    }
    
    
}
