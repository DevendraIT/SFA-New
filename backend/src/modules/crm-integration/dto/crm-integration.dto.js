/**
 * CRM Integration DTO Formatter
 */

export function formatImportSummary(importRecord) {
  if (!importRecord) return null;

  return {
    id: importRecord.id,
    organizationId: importRecord.organizationId,
    fileName: importRecord.fileName,
    uploadedBy: importRecord.uploadedBy,
    uploader: importRecord.uploader
      ? {
          id: importRecord.uploader.id,
          name: `${importRecord.uploader.firstName || ''} ${importRecord.uploader.lastName || ''}`.trim(),
          email: importRecord.uploader.email,
        }
      : null,
    totalRows: importRecord.totalRows,
    successfulRows: importRecord.successfulRows,
    failedRows: importRecord.failedRows,
    status: importRecord.status,
    summary: importRecord.summary || {},
    errors: importRecord.errors || [],
    createdAt: importRecord.createdAt,
    completedAt: importRecord.completedAt,
    rows: importRecord.rows ? importRecord.rows.map(formatImportRow) : undefined,
  };
}

export function formatImportRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    importId: row.importId,
    rowNumber: row.rowNumber,
    crmCustomerId: row.crmCustomerId,
    crmProductId: row.crmProductId,
    customerName: row.customerName,
    phoneNumber: row.phoneNumber,
    email: row.email,
    city: row.city,
    pincode: row.pincode,
    address: row.address,
    productCode: row.productCode,
    productName: row.productName,
    quantity: row.quantity,
    requirement: row.requirement,
    leadSource: row.leadSource,
    expectedValue: row.expectedValue,
    customFields: row.customFields || {},
    mappedCustomerId: row.mappedCustomerId,
    mappedCustomer: row.customer
      ? {
          id: row.customer.id,
          name: row.customer.name,
          crmId: row.customer.crmId,
          email: row.customer.email,
          phone: row.customer.phone,
        }
      : null,
    mappedProductId: row.mappedProductId,
    mappedProduct: row.product
      ? {
          id: row.product.id,
          name: row.product.name,
          sku: row.product.sku,
          productCode: row.product.productCode,
          price: row.product.price,
        }
      : null,
    mappedBranchId: row.mappedBranchId,
    mappedBranch: row.branch
      ? {
          id: row.branch.id,
          name: row.branch.name,
          code: row.branch.code,
        }
      : null,
    mappedTerritoryId: row.mappedTerritoryId,
    mappedTerritory: row.territory
      ? {
          id: row.territory.id,
          name: row.territory.name,
          code: row.territory.code,
        }
      : null,
    status: row.status,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
