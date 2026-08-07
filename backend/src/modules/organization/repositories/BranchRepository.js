import { prisma } from '../../../config/database.js';

/**
 * Branch Repository
 * Handles all database operations for Branch entity
 */
export class BranchRepository {

  // Standard includes for branch queries
  #branchIncludes = {
    organization: { 
      select: { 
        id: true, 
        name: true 
      } 
    },
    department: { 
      select: { id: true, name: true }
    },
    territory: { 
      select: { id: true, name: true }
    },
    teams: { 
      orderBy: { name: 'asc' } 
    },
    _count: { 
      select: { 
        users: true, 
        teams: true 
      } 
    },
    warehouses: {
      select: { id: true, name: true, code: true }
    }
  };

  // Build where clause for branch queries
  #buildWhereClause(organizationId, { search } = {}) {
    const where = {
      organizationId
    };
    
    
    if (search) {
      where.name = { 
        contains: search, 
        mode: 'insensitive' 
      };
    }
    
    return where;
  }

  async findAll(organizationId, options = {}) {
    const {
      skip = 0,
      take = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const where = this.#buildWhereClause(organizationId, { search });

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: { 
            select: { 
              id: true, 
              name: true 
            } 
          },
          department: { select: { id: true, name: true } },
          territory: { select: { id: true, name: true } },
          _count: { 
            select: { 
              users: true, 
              teams: true 
            } 
          },
          warehouses: {
            select: { id: true, name: true, code: true }
          }
        },
      }),
      prisma.branch.count({ where }),
    ]);

    return { branches, total };
  }

  async findById(id, organizationId) {
    return prisma.branch.findFirst({
      where: { 
        id, 
        organizationId
      },
      include: this.#branchIncludes,
    });
  }

  async findByCode(organizationId, code) {
    return prisma.branch.findUnique({
      where: { 
        organizationId_code: { 
          organizationId, 
          code 
        } 
      },
    });
  }

  async create(data) {
    return prisma.branch.create({ 
      data,
      include: {
        organization: { 
          select: { 
            id: true, 
            name: true 
          } 
        },
        department: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        _count: { 
          select: { 
            users: true, 
            teams: true 
          } 
        },
        warehouses: {
          select: { id: true, name: true, code: true }
        }
      },
    });
  }

  async update(id, data) {
    return prisma.branch.update({
      where: { id },
      data,
      include: {
        organization: { 
          select: { 
            id: true, 
            name: true 
          } 
        },
        department: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        _count: { 
          select: { 
            users: true, 
            teams: true 
          } 
        },
        warehouses: {
          select: { id: true, name: true, code: true }
        }
      },
    });
  }

  async delete(id) {
    return prisma.branch.delete({
      where: { id },
    });
  }

  async softDelete(id) {
    return prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id) {
    return prisma.branch.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async bulkCreate(data) {
    return prisma.branch.createMany({ data, skipDuplicates: true });
  }

  async bulkUpdate(updates) {
    return Promise.all(
      updates.map(({ id, ...data }) => this.update(id, data))
    );
  }

  async existsByCode(organizationId, code, excludeId = null) {
    const where = { 
      organizationId, 
      code 
    };
    
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await prisma.branch.count({ where });
    return count > 0;
  }

  async belongsToOrganization(branchId, organizationId) {
    const branch = await prisma.branch.findFirst({
      where: { 
        id: branchId, 
        organizationId
      },
      select: { id: true },
    });
    
    return !!branch;
  }

  async countActiveUsers(branchId) {
    return prisma.user.count({
      where: {
        branchId,
        isActive: true,
        deletedAt: null,
      },
    });
  }
}