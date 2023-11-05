import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString({ each: true }) // Ensure each item in the array is a string
    events?: string[];

    // The invitedEvents would not typically be included here, similar to CreateUserDto,
    // unless you have a specific design that requires direct manipulation of this relation.
    // This would also be more complex to validate and update.
}