import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString({ each: true }) // Ensure each item in the array is a string
    events?: string[];

}