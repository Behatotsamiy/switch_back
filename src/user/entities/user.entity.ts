import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Registration } from '../../registration/entities/registration.entity';
import { Certificate } from '../../certificate/entities/certificate.entity';

export enum UserRole {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // хранится хэш, не plain text

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @OneToMany(() => Registration, (reg) => reg.user)
  registrations: Registration[];

  @OneToMany(() => Certificate, (cert) => cert.user)
  certificates: Certificate[];
  
  @Column({ nullable: true, select: false })
  refreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;
}