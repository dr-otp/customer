import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { IsCuid } from 'src/common';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsCuid()
  id: string;
}
