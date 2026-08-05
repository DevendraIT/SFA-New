import { prisma } from '../../../config/database.js';

/**
 * Territory Repository
 * Handles all database operations for Territory entity
 */
export class TerritoryRepository {

  // Standard includes for territory queries
  #territoryIncludes = {
    organization: { 
      select: { 
        id: true, 
        name: true 
      } 
    },
    department: {
      select: { id: true, name: true }
    },
    branches: { orderBy: { name: 'asc' } },
    teams: { 
      orderBy: { name: 'asc' } 
    },
    _count: { 
      select: { 
        teams: true, 
        users: true 
      } 
    },
  };

  // Build where clause for territory queries
  #buildWhereClause(organizationId, { search } = {}) {
    const where = { organizationId };
    
    
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

    const [territories, total] = await Promise.all([
      prisma.territory.findMany({
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
          _count: { 
            select: { 
              teams: true, 
              users: true 
            } 
          },
        },
      }),
      prisma.territory.count({ where }),
    ]);

    return { territories, total };
  }

  async findById(id, organizationId) {
    return prisma.territory.findFirst({
      where: { 
        id, 
        organizationId 
      },
      include: this.#territoryIncludes,
    });
  }

  async findByCode(organizationId, code) {
    return prisma.territory.findUnique({
      where: { 
        organizationId_code: { 
          organizationId, 
          code 
        } 
      },
    });
  }

  async create(data) {
    return prisma.territory.create({ 
      data,
      include: {
        organization: { 
          select: { 
            id: true, 
            name: true 
          } 
        },
        _count: { 
          select: { 
            teams: true, 
            users: true 
          } 
        },
      },
    });
  }

  async update(id, data) {
    return prisma.territory.update({
      where: { id },
      data,
      include: {
        organization: { 
          select: { 
            id: true, 
            name: true 
          } 
        },
        _count: { 
          select: { 
            teams: true, 
            users: true 
          } 
        },
      },
    });
  }

  async delete(id) {
    return prisma.territory.delete({
      where: { id },
    });
  }

  async softDelete(id) {
    return prisma.territory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id) {
    return prisma.territory.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async bulkCreate(data) {
    return prisma.territory.createMany({ data, skipDuplicates: true });
  }

  async bulkUpdate(updates) {
    return Promise.all(
      updates.map(({ id, ...data }) => this.update(id, data))
    );
  }
}