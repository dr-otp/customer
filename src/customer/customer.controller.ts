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

  @MessagePattern('customer.find.all.summary')
  findAllSummary(@Payload() payload: { pagination: PaginationDto; user: User }) {
    const { pagination, user } = payload;
    return this.customerService.findAllSummary(pagination, user);
  }

  @MessagePattern('customer.find.one')
  findOne(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    if (!isCuid(id))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid customer id',
      });

    return this.customerService.findOne(id, user);
  }

  @MessagePattern('customer.find.one.code')
  findOneByCode(@Payload() payload: { code: number; user: User }) {
    const { code, user } = payload;

    if (isNaN(code))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid customer code',
      });

    return this.customerService.findOneByCode(code, user);
  }

  @MessagePattern('customer.find.one.summary')
  findOneSummary(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;

    if (!isCuid(id))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid voucher id',
      });

    return this.customerService.findOneSummary(id, user);
  }

  @MessagePattern('customer.find.many.summary')
  findManySummary(@Payload('ids') ids: string[]) {
    const invalidIds = ids.filter((id) => !isCuid(id));
    if (invalidIds.length > 0)
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid customer ids: ${invalidIds.join(', ')}`,
      });

    return this.customerService.findManySummary(ids);
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
