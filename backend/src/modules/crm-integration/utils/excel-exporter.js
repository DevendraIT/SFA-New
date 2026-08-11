import * as XLSX from 'xlsx';

/**
 * Generate Sample Excel Template Buffer
 */
export function generateSampleTemplate() {
  const sampleData = [
    {
      'Customer ID': 'CUST-1001',
      'Customer Name': 'ABC Telecom',
      'Phone Number': '9876543210',
      'Email': 'abc@example.com',
      'City': 'Indore',
      'Pincode': '452001',
      'Address': '123 MG Road',
      'Product ID': 'PROD-001',
      'Product Code': 'JIO-FIBER',
      'Product Name': 'Jio Fiber',
      'Quantity': 10,
      'Requirement': 'High speed fiber connection',
      'Lead Source': 'Website',
      'Expected Value': 15000,
      'GST Number': '23AAAAA0000A1Z5',
    },
    {
      'Customer ID': 'CUST-1002',
      'Customer Name': 'XYZ Services',
      'Phone Number': '9876543211',
      'Email': 'xyz@example.com',
      'City': 'Bhopal',
      'Pincode': '462001',
      'Address': '456 MP Nagar',
      'Product ID': 'PROD-002',
      'Product Code': 'ROUTER-01',
      'Product Name': 'Dual Band Router',
      'Quantity': 5,
      'Requirement': 'Enterprise Wi-Fi Router',
      'Lead Source': 'Exhibition',
      'Expected Value': 25000,
      'GST Number': '23BBBBB0000B1Z6',
    },
    {
      'Customer ID': 'CUST-1003',
      'Customer Name': 'PQR Enterprises',
      'Phone Number': '9876543212',
      'Email': 'pqr@example.com',
      'City': 'Ujjain',
      'Pincode': '456001',
      'Address': '789 Freeganj',
      'Product ID': 'PROD-003',
      'Product Code': 'MODEM-01',
      'Product Name': 'Industrial Modem',
      'Quantity': 20,
      'Requirement': 'Modem supply',
      'Lead Source': 'Cold Call',
      'Expected Value': 40000,
      'GST Number': '23CCCCC0000C1Z7',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM_Import_Template');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return buffer;
}

/**
 * Generate Export Excel Buffer for Mapped CRM Data
 */
export function generateExportExcel(rows) {
  const exportData = rows.map(row => {
    const custom = row.customFields || {};
    return {
      'Import Row ID': row.id,
      'Row Number': row.rowNumber,
      'CRM Customer ID': row.crmCustomerId || '',
      'Customer Name': row.customerName || '',
      'Phone Number': row.phoneNumber || '',
      'Email': row.email || '',
      'City': row.city || '',
      'Pincode': row.pincode || '',
      'Address': row.address || '',
      'CRM Product ID': row.crmProductId || '',
      'Product Code': row.productCode || '',
      'Product Name': row.productName || '',
      'Quantity': row.quantity || 0,
      'Requirement': row.requirement || '',
      'Lead Source': row.leadSource || '',
      'Expected Value': row.expectedValue || 0,
      'Mapped SFA Customer ID': row.mappedCustomerId || 'UNMAPPED',
      'SFA Customer Name': row.customer ? row.customer.name : 'UNMAPPED',
      'Mapped SFA Product ID': row.mappedProductId || 'UNMAPPED',
      'SFA Product SKU/Code': row.product ? (row.product.productCode || row.product.sku) : 'UNMAPPED',
      'Mapped SFA Branch': row.branch ? row.branch.name : 'UNMAPPED',
      'Mapped SFA Territory': row.territory ? row.territory.name : 'UNMAPPED',
      'Mapping Status': row.status,
      'Error Details': row.errorMessage || '',
      ...custom,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM_Export_Data');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return buffer;
}
