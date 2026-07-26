import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { RegistrationModule } from './registration/registration.module';
import { SpeakerModule } from './speaker/speaker.module';
import { CertificateModule } from './certificate/certificate.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [UserModule, EventModule, RegistrationModule, SpeakerModule, CertificateModule, ProjectsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
