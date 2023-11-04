import { EventStatus } from '../event.entity'; 
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export class CreateEventDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(EventStatus)
    status?: EventStatus = EventStatus.TODO;

    @IsOptional()
    @IsDate()
    startTime?: Date;

    @IsOptional()
    @IsDate()
    endTime?: Date;

    // invitees are not included in the Create DTO since they are typically set through a different mechanism
}
