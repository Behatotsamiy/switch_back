import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { RegistrationModule } from './registration/registration.module';
import { SpeakerModule } from './speaker/speaker.module';
import { CertificateModule } from './certificate/certificate.module';
import { ProjectsModule } from './projects/projects.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './_auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
     useFactory: (configService: ConfigService) => {
  const databaseUrl = configService.get('DATABASE_URL');

  // Если есть строка подключения (Render / Neon), работаем по ней
if (databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    type: 'postgres',
    host: url.hostname,
    port: 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    autoLoadEntities: true,
    synchronize: true,
    ssl: { 
      rejectUnauthorized: false,
    },
  };
}

  // Если строки нет (локалка), берем обычные переменные из .env
  return {
    type: 'postgres',
    host: configService.get('DB_HOST') || 'localhost',
    port: +configService.get('DB_PORT') || 5433,
    username: configService.get('DB_USERNAME') || 'postgres',
    password: configService.get('DB_PASSWORD') || 'root',
    database: configService.get('DB_NAME') || 'switch_db',
    autoLoadEntities: true,
    synchronize: true,
    logging: true,
    uuidExtension: 'pgcrypto',
  };
},
    }), UserModule, EventModule, RegistrationModule, SpeakerModule, CertificateModule, ProjectsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
