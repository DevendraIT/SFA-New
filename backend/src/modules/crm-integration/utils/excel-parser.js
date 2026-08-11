import * as XLSX from 'xlsx';
import { AppError } from '../../../shared/response.js';
import { REQUIRED_EXCEL_COLUMNS } from '../constants/crm-integration.constants.js';

/**
 * Normalizes header string: lowercase and trim
 */
function normalizeHeader(header) {
  if (!header) return '';
  return String(header).trim().toLowerCase();
}

/**
 * Map raw row headers to standard fields vs custom fields
 */
function parseRow(row, rowIndex) {
  const standardMap = {};
  const customFields = {};

  for (const [key, rawValue] of Object.entries(row)) {
    const normKey = normalizeHeader(key);
    const val = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : null;

    if (!normKey) continue;

    if (normKey === 'customer id' || normKey === 'customer_id' || normKey === 'custid') {
      standardMap.crmCustomerId = val;
    } else if (normKey === 'customer name' || normKey === 'customer_name' || normKey === 'name') {
      standardMap.customerName = val;
    } else if (normKey === 'phone number' || normKey === 'phone_number' || normKey === 'phone' || normKey === 'mobile') {
      standardMap.phoneNumber = val;
    } else if (normKey === 'email' || normKey === 'email address') {
      standardMap.email = val;
    } else if (normKey === 'city') {
      standardMap.city = val;
    } else if (normKey === 'pincode' || normKey === 'pin code' || normKey === 'postalcode' || normKey === 'zipcode') {
      standardMap.pincode = val;
    } else if (normKey === 'address' || normKey === 'street') {
      standardMap.address = val;
    } else if (normKey === 'product id' || normKey === 'product_id' || normKey === 'prodid') {
      standardMap.crmProductId = val;
    } else if (normKey === 'product code' || normKey === 'product_code' || normKey === 'sku') {
      standardMap.productCode = val;
    } else if (normKey === 'product name' || normKey === 'product_name') {
      standardMap.productName = val;
    } else if (normKey === 'quantity' || normKey === 'qty') {
      standardMap.quantity = val ? parseFloat(val) : null;
    } else if (normKey === 'requirement' || normKey === 'requirements' || normKey === 'description') {
      standardMap.requirement = val;
    } else if (normKey === 'lead source' || normKey === 'lead_source' || normKey === 'source') {
      standardMap.leadSource = val;
    } else if (normKey === 'expected value' || normKey === 'expected_value' || normKey === 'deal value') {
      standardMap.expectedValue = val ? parseFloat(val) : null;
    } else {
      // Dynamic Custom Field
      customFields[key.trim()] = rawValue;
    }
  }

  return {
    rowNumber: rowIndex + 2, // Excel 1-based header is line 1, data starts row 2
    ...standardMap,
    customFields,
  };
}

/**
 * Parse Excel Buffer using XLSX library
 */
export function parseExcelBuffer(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw AppError.badRequest('Excel file does not contain any sheets');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      throw AppError.badRequest('Excel sheet is empty or has no data rows');
    }

    // Header validation
    const sampleRow = rawRows[0];
    const presentHeaders = Object.keys(sampleRow).map(normalizeHeader);

    for (const reqCol of REQUIRED_EXCEL_COLUMNS) {
      const matched = presentHeaders.some(h => h.includes(reqCol));
      if (!matched) {
        throw AppError.badRequest(`Missing required Excel column: '${reqCol}'. Standard required headers are 'Customer ID', 'Product ID', 'Quantity'.`);
      }
    }

    const parsedRows = rawRows.map((row, idx) => parseRow(row, idx));
    return parsedRows;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.badRequest(`Failed to parse Excel file: ${error.message}`);
  }
}
