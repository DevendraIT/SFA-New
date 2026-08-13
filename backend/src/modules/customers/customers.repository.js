import { prisma } from '../../config/database.js';

export class CustomerRepository {
  async findAll(organizationId, filters = {}) {
    const { skip = 0, take = 50, search, branchId } = filters;
    let where = organizationId ? { organizationId } : {};

    if (branchId) {
      where.OR = [
        { orders: { some: { branchId } } },
        { visits: { some: { user: { branchId } } } }
      ];
    }

    if (search) {
      const searchWhere = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
      where = {
        AND: [
          where,
          searchWhere
        ]
      };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  async findById(id, organizationId) {
    let customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: { orders: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) {
      customer = await prisma.customer.findFirst({
        where: { id },
        include: { orders: { take: 5, orderBy: { createdAt: 'desc' } } },
      });
    }
    return customer;
  }

  async create(data) {
    return prisma.customer.create({ data });
  }

  async update(id, organizationId, data) {
    return prisma.customer.update({
      where: { id, organizationId },
      data,
    });
  }

  async delete(id, organizationId) {
    return prisma.customer.delete({
      where: { id, organizationId },
    });
  }
}

