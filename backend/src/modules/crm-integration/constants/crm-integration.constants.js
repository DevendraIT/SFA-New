/**
 * CRM Integration Constants
 */

export const IMPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
};

export const ROW_STATUS = {
  PENDING: 'PENDING',
  MAPPED: 'MAPPED',
  UNMAPPED_CUSTOMER: 'UNMAPPED_CUSTOMER',
  UNMAPPED_BRANCH: 'UNMAPPED_BRANCH',
  INVALID_PRODUCT: 'INVALID_PRODUCT',
  FAILED: 'FAILED',
  PROCESSED: 'PROCESSED',
};

export const STANDARD_EXCEL_COLUMNS = [
  'customer id',
  'customer name',
  'phone number',
  'phone',
  'email',
  'city',
  'pincode',
  'pin code',
  'address',
  'product id',
  'product code',
  'product name',
  'quantity',
  'qty',
  'requirement',
  'lead source',
  'expected value',
];

export const REQUIRED_EXCEL_COLUMNS = [
  'customer id',
  'product id',
  'quantity',
];
