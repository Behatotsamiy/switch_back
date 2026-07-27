import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Event } from '../../event/entities/event.entity';

@Entity('speakers')
export class Speaker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ nullable: true })
  position: string; // например "Frontend Developer at X"

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  telegram: string;

  @Column({ nullable: true })
  linkedin: string;

  @ManyToMany(() => Event, (event) => event.speakers)
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;
}