import { Controller, Get, Post, Param, Delete, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto'; // DTO import

@Controller('users') // set api routes
export class UserController {
  constructor(private readonly userService: UserService) {}

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
/*
  @Post(':userId/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT) // Sets the HTTP status code to 204 No Content
  async addEventToUser(@Param('userId') userId: number, @Param('eventId') eventId: number) {
    return this.userService.addEventToUser(userId, eventId);
  }

  @Delete(':userId/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT) // Sets the HTTP status code to 204 No Content
  async removeEventFromUser(@Param('userId') userId: number, @Param('eventId') eventId: number) {
    return this.userService.removeEventFromUser(userId, eventId);
  }
*/
}
