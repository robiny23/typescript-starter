import { Controller, Get, Post, Param, Delete, HttpCode, HttpStatus, Body, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto'; // DTO import

@Controller('users') // set api routes
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    findAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<User> {
        return this.userService.findOne(id);
    }

    @Delete('delete/:id')
    remove(@Param('id') id: number): Promise<void> {
        return this.userService.remove(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED) // Sets the HTTP status code to 201 Created
    create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.userService.create(createUserDto);
    }

    @Get('eventCount/:userId')
    async getEventCount(@Param('userId') userId: number) {
        const user = await this.userService.findOne(userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        const eventCount = user.events.length;

        return { userId: userId, eventCount: eventCount };
    }
}
