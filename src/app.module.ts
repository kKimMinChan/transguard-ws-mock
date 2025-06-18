import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransGuardFakeGateway } from './transGuard.fake.gateway';

@Module({
  imports: [TransGuardFakeGateway],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
