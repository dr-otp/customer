import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
  imports: [NatsModule],
})
export class CustomerModule {}
