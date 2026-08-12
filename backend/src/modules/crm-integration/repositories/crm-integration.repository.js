import { prisma } from '../../../config/database.js';

export class CRMIntegrationRepository {
  async createImport(data) {
    return prisma.cRMImport.create({
      data,
    });
  }

  async createImportRows(rowsData) {
    return prisma.cRMImportRow.createMany({
      data: rowsData,
    });
  }

  async updateImport(id, organizationId, data) {
    return prisma.cRMImport.update({
      where: { id, organizationId },
      data,
    });
  }

  async findImports(organizationId, { skip = 0, take = 20, status } = {}) {
    const where = { organizationId };
    if (status) where.status = status;

    const [imports, total] = await Promise.all([
      prisma.cRMImport.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.cRMImport.count({ where }),
    ]);

    return { imports, total };
  }

  async findImportById(id, organizationId) {
    return prisma.cRMImport.findFirst({
      where: { id, organizationId },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        rows: {
          orderBy: { rowNumber: 'asc' },
          include: {
            customer: true,
            product: true,
            branch: true,
            territory: true,
          },
        },
      },
    });
  }

  async findImportRowById(id, organizationId) {
    return prisma.cRMImportRow.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        product: true,
        branch: true,
        territory: true,
      },
    });
  }

  async findImportRowsByImportId(importId, organizationId) {
    return prisma.cRMImportRow.findMany({
      where: { importId, organizationId },
      orderBy: { rowNumber: 'asc' },
      include: {
        customer: true,
        product: true,
        branch: true,
        territory: true,
      },
    });
  }

  async updateImportRow(id, organizationId, data) {
    return prisma.cRMImportRow.update({
      where: { id, organizationId },
      data,
      include: {
        customer: true,
        product: true,
        branch: true,
        territory: true,
      },
    });
  }

  async findMappedRowsForConversion(importId, organizationId) {
    return prisma.cRMImportRow.findMany({
      where: {
        importId,
        organizationId,
        status: 'MAPPED',
        mappedCustomerId: { not: null },
        mappedProductId: { not: null },
      },
      orderBy: { rowNumber: 'asc' },
      include: {
        customer: true,
        product: true,
        branch: true,
        territory: true,
      },
    });
  }

  async markRowsAsProcessed(rowIds, organizationId, tx = prisma) {
    return tx.cRMImportRow.updateMany({
      where: {
        id: { in: rowIds },
        organizationId,
      },
      data: {
        status: 'PROCESSED',
        errorMessage: null,
      },
    });
  }
}
