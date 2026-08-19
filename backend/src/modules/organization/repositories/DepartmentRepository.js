import { prisma } from '../../../config/database.js';

/**
 * Department Repository
 * Handles all database operations for Department entity
 */
export class DepartmentRepository {

  #departmentIncludes = {
    organization: {
      select: {
        id: true,
        name: true,
      },
    },
    territories: {
      orderBy: { name: 'asc' }
    },
    branches: {
      orderBy: { name: 'asc' }
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
  };

  // Build where clause for department queries
  #buildWhereClause(organizationId, { search } = {}) {
    const where = {
      organizationId
    };
    
    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { organization: { name: { contains: term, mode: 'insensitive' } } },
        { branches: { some: { name: { contains: term, mode: 'insensitive' } } } },
        { teams: { some: { name: { contains: term, mode: 'insensitive' } } } },
        { territories: { some: { name: { contains: term, mode: 'insensitive' } } } },
      ];
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

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          branches: {
            select: { id: true, name: true, code: true, city: true }
          },
          territories: {
            select: { id: true, name: true, code: true }
          },
          teams: {
            select: { id: true, name: true, description: true }
          },
          users: {
            where: { deletedAt: null },
            select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, isActive: true }
          },
          _count: { 
            select: { 
              branches: true,
              users: true, 
              teams: true 
            } 
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return { departments, total };
  }

  async findById(id, organizationId) {
    return prisma.department.findFirst({
      where: { 
        id, 
        organizationId
      },
      include: this.#departmentIncludes,
    });
  }

  async findByCode(organizationId, code) {
    return prisma.department.findUnique({
      where: { 
        organizationId_code: { 
          organizationId, 
          code 
        } 
      },
    });
  }

  async create(data) {
    return prisma.department.create({ 
      data,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { 
          select: { 
            users: true, 
            teams: true 
          } 
        },
      },
    });
  }

  async update(id, data) {
    return prisma.department.update({
      where: { id },
      data,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { 
          select: { 
            users: true, 
            teams: true 
          } 
        },
      },
    });
  }

  async delete(id) {
    return prisma.department.delete({
      where: { id },
    });
  }

  async softDelete(id) {
    return prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id) {
    return prisma.department.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async bulkCreate(data) {
    return prisma.department.createMany({ data, skipDuplicates: true });
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

    const count = await prisma.department.count({ where });
    return count > 0;
  }
}