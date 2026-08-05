import { prisma } from '../../../config/database.js';

export class OrganizationRepository {
  #buildWhereClause(options = {}) {
    const where = {};

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { slug: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return where;
  }

  async findAll(options = {}) {
    const {
      skip = 0,
      take = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
    } = options;

    const where = this.#buildWhereClause({ search, isActive });

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return { organizations, total };
  }

  async findById(id) {
    return prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        gstNumber: true,
        panNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByName(name) {
    return prisma.organization.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });
  }

  async findBySlug(slug) {
    return prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });
  }

  async existsById(id) {
    const count = await prisma.organization.count({ where: { id } });
    return count > 0;
  }

  async existsByName(name, excludeId = null) {
    const where = { name: { equals: name, mode: 'insensitive' } };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const count = await prisma.organization.count({ where });
    return count > 0;
  }

  async existsBySlug(slug, excludeId = null) {
    const where = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const count = await prisma.organization.count({ where });
    return count > 0;
  }

  async create(data) {
    return prisma.organization.create({
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        gstNumber: true,
        panNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id, data) {
    return prisma.organization.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        gstNumber: true,
        panNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id) {
    return prisma.organization.delete({
      where: { id },
      select: { id: true },
    });
  }

  async getStatistics(organizationId) {
    const [
      branchesCount,
      departmentsCount,
      territoriesCount,
      activeUsersCount,
      inactiveUsersCount,
    ] = await Promise.all([
      prisma.branch.count({
        where: { organizationId },
      }),
      prisma.department.count({
        where: { organizationId },
      }),
      prisma.territory.count({
        where: { organizationId },
      }),
      prisma.user.count({
        where: { organizationId, isActive: true },
      }),
      prisma.user.count({
        where: { organizationId, isActive: false },
      }),
    ]);

    return {
      companies: 0,
      branches: branchesCount,
      departments: departmentsCount,
      territories: territoriesCount,
      users: {
        active: activeUsersCount,
        inactive: inactiveUsersCount,
      },
    };
  }
}
