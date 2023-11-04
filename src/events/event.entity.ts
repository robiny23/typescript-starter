import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';

export enum EventStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: EventStatus,
        default: EventStatus.TODO
    })
    status: EventStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'datetime', nullable: true })
    startTime: Date;

    @Column({ type: 'datetime', nullable: true })
    endTime: Date;

    @ManyToMany(() => User, user => user.invitedEvents)
    @JoinTable() 
    invitees: User[];
}
