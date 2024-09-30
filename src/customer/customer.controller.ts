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

  @MessagePattern('customer.create')
  create(@Payload() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
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
  update(@Payload() payload: { updateDto: UpdateCustomerDto; user: User }) {
    const { updateDto, user } = payload;
    return this.customerService.update(updateDto, user);
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
