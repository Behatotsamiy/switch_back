import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Registration } from '../../registration/entities/registration.entity';
import { Speaker } from '../../speaker/entities/speaker.entity';
import { Certificate } from '../../certificate/entities/certificate.entity';

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  location: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ type: 'int', nullable: true })
  maxParticipants: number;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.UPCOMING })
  status: EventStatus;

  @ManyToMany(() => Speaker, (speaker) => speaker.events)
  @JoinTable({
    name: 'event_speakers',
    joinColumn: { name: 'eventId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'speakerId', referencedColumnName: 'id' },
  })
  speakers: Speaker[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: number | null; // null или 0 — бесплатное событие, оплата не требуется

  @OneToMany(() => Registration, (reg) => reg.event)
  registrations: Registration[];

  @OneToMany(() => Certificate, (cert) => cert.event)
  certificates: Certificate[];

  @CreateDateColumn()
  createdAt: Date;
}
