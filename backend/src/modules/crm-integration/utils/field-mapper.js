import { prisma } from '../../../config/database.js';

/**
 * Field Mapper Utility - Initial Lookups
 * Attempts to find existing SFA Customer, Product, Branch, Territory
 * for mapping suggestions during Excel ingestion.
 */

export async function findCustomerMatch(organizationId, rowData) {
  const { crmCustomerId, phoneNumber, email } = rowData;

  // 1. Try matching by crmId
  if (crmCustomerId) {
    const byCrmId = await prisma.customer.findFirst({
      where: { organizationId, crmId: crmCustomerId },
    });
    if (byCrmId) return byCrmId;
  }

  // 2. Try matching by Phone
  if (phoneNumber) {
    const byPhone = await prisma.customer.findFirst({
      where: { organizationId, phone: phoneNumber },
    });
    if (byPhone) return byPhone;
  }

  // 3. Try matching by Email
  if (email) {
    const byEmail = await prisma.customer.findFirst({
      where: { organizationId, email: { equals: email, mode: 'insensitive' } },
    });
    if (byEmail) return byEmail;
  }

  return null;
}

export async function findProductMatch(organizationId, rowData) {
  const { crmProductId, productCode } = rowData;

  // 1. Try productCode
  if (productCode) {
    const byCode = await prisma.product.findFirst({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { productCode: { equals: productCode, mode: 'insensitive' } },
          { sku: { equals: productCode, mode: 'insensitive' } },
        ],
      },
    });
    if (byCode) return byCode;
  }

  // 2. Try crmProductId as sku/productCode
  if (crmProductId) {
    const byCrmProd = await prisma.product.findFirst({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { sku: { equals: crmProductId, mode: 'insensitive' } },
          { productCode: { equals: crmProductId, mode: 'insensitive' } },
        ],
      },
    });
    if (byCrmProd) return byCrmProd;
  }

  return null;
}

export async function findBranchMatch(organizationId, rowData) {
  const { city, pincode } = rowData;

  if (pincode) {
    const byPin = await prisma.branch.findFirst({
      where: { organizationId, postalCode: pincode },
    });
    if (byPin) return byPin;
  }

  if (city) {
    const byCity = await prisma.branch.findFirst({
      where: { organizationId, city: { equals: city, mode: 'insensitive' } },
    });
    if (byCity) return byCity;
  }

  return null;
}

export async function findTerritoryMatch(organizationId, rowData) {
  const { city } = rowData;

  if (city) {
    const byCity = await prisma.territory.findFirst({
      where: { organizationId, name: { contains: city, mode: 'insensitive' } },
    });
    if (byCity) return byCity;
  }

  return null;
}
