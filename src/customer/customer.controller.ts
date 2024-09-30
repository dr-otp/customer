import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { isCuid } from '@paralleldrive/cuid2';
import { PaginationDto, User } from 'src/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern('customer.health')
  healthCheck() {
    return 'Customer service is up and running';
  }

  @MessagePattern('customer.create')
  create(@Payload() payload: { createCustomerDto: CreateCustomerDto; user: User }) {
    const { createCustomerDto, user } = payload;
    return this.customerService.create(createCustomerDto, user);
  }

  @MessagePattern('customer.find.all')
  findAll(@Payload() payload: { pagination: PaginationDto; user: User }) {
    const { pagination, user } = payload;
    return this.customerService.findAll(pagination, user);
  }

  @MessagePattern('customer.find.one')
  findOne(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    if (!isCuid(id))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid voucher id',
      });

    return this.customerService.findOne(id, user);
  }

  @MessagePattern('customer.update')
  update(@Payload() payload: { updateCustomerDto: UpdateCustomerDto; user: User }) {
    const { updateCustomerDto, user } = payload;
    return this.customerService.update(updateCustomerDto, user);
  }

  @MessagePattern('customer.remove')
  remove(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    return this.customerService.remove(id, user);
  }

  @MessagePattern('customer.restore')
  restore(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    return this.customerService.restore(id, user);
  }
}
