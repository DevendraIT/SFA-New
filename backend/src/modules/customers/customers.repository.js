import { prisma } from '../../config/database.js';

export class CustomerRepository {
  async findAll(organizationId, filters = {}) {
    const { skip = 0, take = 50, search, branchId, userId } = filters;
    let where = organizationId ? { organizationId } : {};

    // Strictly filter out unmapped/unlinked customers — include only customers with MAPPED or PROCESSED Excel CRM import rows or active Sales Orders
    const importOrOrderWhere = {
      OR: [
        {
          crmImportRows: {
            some: {
              status: { in: ['MAPPED', 'PROCESSED'] },
              ...(branchId ? { mappedBranchId: branchId } : {})
            }
          }
        },
        {
          orders: {
            some: branchId ? { branchId } : {}
          }
        },
        ...(userId ? [
          {
            crmImportRows: {
              some: {
                status: { in: ['MAPPED', 'PROCESSED'] },
                crmImport: { uploadedBy: userId }
              }
            }
          },
          {
            orders: {
              some: { ownerId: userId }
            }
          }
        ] : [])
      ]
    };

    where = {
      AND: [
        where,
        importOrOrderWhere
      ]
    };

    if (search) {
      const searchWhere = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
      where.AND.push(searchWhere);
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

