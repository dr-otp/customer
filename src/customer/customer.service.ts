import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Customer, PrismaClient } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

import { ListResponse, PaginationDto, Role, User, UserSummary } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { hasRoles } from 'src/helpers';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomerService extends PrismaClient implements OnModuleInit {
  private logger = new Logger(CustomerService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database \\(^.^)/');
  }

  async create(createCustomerDto: CreateCustomerDto, user: User): Promise<Partial<Customer>> {
    try {
      const { email, name } = createCustomerDto;

      return await this.customer.create({
        data: { email, name, createdById: user.id },
      });
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create customer',
      });
    }
  }

  async findAll(pagination: PaginationDto, user: User): Promise<ListResponse<Customer>> {
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? {} : { deletedAt: null };
    const total = await this.customer.count({ where });
    const lastPage = Math.ceil(total / limit);

    const data = await this.customer.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    const computedData = await this.getUsers(data);

    return { meta: { total, page, lastPage }, data: computedData };
  }

  async findOne(id: string, user: User): Promise<Partial<Customer>> {
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? {} : { deletedAt: null };
    const voucher = await this.customer.findUnique({
      where: { id, ...where },
    });

    if (!voucher)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Voucher with id ${id} not found`,
      });

    const [computedVoucher] = await this.getUsers([voucher]);

    return computedVoucher;
  }

  async update(updateCustomerDto: UpdateCustomerDto, user: User): Promise<Partial<Customer>> {
    try {
      console.log('🚀 ~ CustomerService ~ update ~ updateCustomerDto:', updateCustomerDto);
      const { id, ...data } = updateCustomerDto;

      await this.findOne(id, user);

      const updatedData = await this.customer.update({
        where: { id },
        data: { ...data, updatedById: user.id },
      });

      const [computedData] = await this.getUsers([updatedData]);

      return computedData;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update customer',
      });
    }
  }

  async remove(id: string, user: User): Promise<Partial<Customer>> {
    try {
      const customer = await this.findOne(id, user);

      if (customer.deletedAt !== null)
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Customer with id ${id} is already deleted`,
        });

      const updatedData = await this.customer.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: user.id },
      });

      const [computedData] = await this.getUsers([updatedData]);

      return computedData;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete customer',
      });
    }
  }

  async restore(id: string, user: User) {
    try {
      const customer = await this.findOne(id, user);

      if (customer.deletedAt === null)
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Customer with id ${id} is already active`,
        });

      const updatedData = await this.customer.update({
        where: { id },
        data: { deletedAt: null, deletedById: null },
      });

      const [computedData] = await this.getUsers([updatedData]);

      return computedData;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to restore customer',
      });
    }
  }

  private async getUsers(customers: Partial<Customer>[]): Promise<Partial<Customer>[]> {
    // Collect all unique user IDs
    const userIds = [
      ...new Set(customers.flatMap((customer) => [customer.createdById, customer.updatedById, customer.deletedById])),
    ].filter((id): id is string => !!id);

    if (userIds.length === 0) return customers;

    // Fetch all users
    let users: UserSummary[];

    try {
      users = await firstValueFrom(this.client.send<UserSummary[]>('users.find.summary.batch', { ids: userIds }));
    } catch (error) {
      this.logger.error('Error fetching user data:', error);
      throw error;
    }

    const userMap = new Map(users.map((user) => [user.id, user]));

    // Map users to customers
    const data = customers.map(({ createdById, updatedById, deletedById, ...rest }) => ({
      ...rest,
      createdBy: createdById ? userMap.get(createdById) : null,
      updatedBy: updatedById ? userMap.get(updatedById) : null,
      deletedBy: deletedById ? userMap.get(deletedById) : null,
    }));

    return data;
  }
}
