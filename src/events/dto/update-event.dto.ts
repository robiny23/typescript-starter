import { IsOptional, IsString, IsEnum, IsDate } from 'class-validator';
import { EventStatus } from '../event.entity'; 

export class UpdateEventDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(EventStatus)
    status?: EventStatus;

    @IsOptional()
    @IsDate()
    startTime?: Date;

    @IsOptional()
    @IsDate()
    endTime?: Date;
}
