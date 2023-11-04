import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Event } from '../events/event.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', nullable: false })
    name: string;

    @Column('simple-array')
    events: string[];

    @ManyToMany(() => Event, event => event.invitees)
    invitedEvents: Event[]; // create relational mapping to Event
}
