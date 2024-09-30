import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto, User } from 'src/common';

@Injectable()
export class CustomerService {
  create(createCustomerDto: CreateCustomerDto) {
    return createCustomerDto;
  }

  findAll(pagination: PaginationDto, user: User) {
    return { pagination, user };
  }

  findOne(id: string, user: User) {
    return { id, user };
  }

  update(updateCustomerDto: UpdateCustomerDto, user: User) {
    return { updateCustomerDto, user };
  }

  remove(id: string, user: User) {
    return { id, user };
  }

  restore(id: string, user: User) {
    return { id, user };
  }
}
