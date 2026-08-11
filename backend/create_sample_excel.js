import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const sampleRows = [
  {
    'Customer ID': 'CUST-1001',
    'Customer Name': 'Apex Telecom Solutions',
    'Phone Number': '9876543210',
    'Email': 'contact@apextelecom.com',
    'City': 'Indore',
    'Pincode': '452001',
    'Address': '101 MG Road, Palasia',
    'Product ID': 'PROD-001',
    'Product Code': 'JIO-FIBER',
    'Product Name': 'Enterprise Fiber Line',
    'Quantity': 10,
    'Requirement': 'Need 100Mbps dedicated fiber line for office branch',
    'Lead Source': 'Website Enquiry',
    'Expected Value': 50000,
    'GST Number': '23AAAAA1234A1Z5',
    'Priority': 'High',
    'Dealer Type': 'Direct Client'
  },
  {
    'Customer ID': 'CUST-1002',
    'Customer Name': 'Bliss Tech Services',
    'Phone Number': '9876543211',
    'Email': 'sales@blisstech.io',
    'City': 'Bhopal',
    'Pincode': '462001',
    'Address': '45 Zone 1, MP Nagar',
    'Product ID': 'PROD-002',
    'Product Code': 'ROUTER-AX3',
    'Product Name': 'AX3 WiFi 6 Router',
    'Quantity': 5,
    'Requirement': 'WiFi 6 routers for office floor expansion',
    'Lead Source': 'Trade Exhibition',
    'Expected Value': 35000,
    'GST Number': '23BBBBB5678B1Z6',
    'Priority': 'Medium',
    'Dealer Type': 'Reseller'
  },
  {
    'Customer ID': 'CUST-1003',
    'Customer Name': 'Crown Logistics Ltd',
    'Phone Number': '9876543212',
    'Email': 'info@crownlogistics.com',
    'City': 'Ujjain',
    'Pincode': '456001',
    'Address': '78 Freeganj Main Road',
    'Product ID': 'PROD-003',
    'Product Code': 'MODEM-4G',
    'Product Name': 'Industrial 4G LTE Modem',
    'Quantity': 20,
    'Requirement': '4G Modems for fleet vehicles tracking unit',
    'Lead Source': 'Cold Call',
    'Expected Value': 80000,
    'GST Number': '23CCCCC9012C1Z7',
    'Priority': 'High',
    'Dealer Type': 'Direct Client'
  },
  {
    'Customer ID': 'CUST-1004',
    'Customer Name': 'Delta Manufacturing',
    'Phone Number': '9876543213',
    'Email': 'procurement@deltamanufacturing.com',
    'City': 'Gwalior',
    'Pincode': '474001',
    'Address': '12 Industrial Area',
    'Product ID': 'PROD-999',
    'Product Code': 'UNKNOWN-PROD',
    'Product Name': 'Custom Sensor Hardware',
    'Quantity': 2,
    'Requirement': 'Custom IoT sensors for factory floor',
    'Lead Source': 'Referral',
    'Expected Value': 15000,
    'GST Number': '23DDDDD3456D1Z8',
    'Priority': 'Low',
    'Dealer Type': 'Distributor'
  },
  {
    'Customer ID': 'CUST-1005',
    'Customer Name': 'Echo Pharma Labs',
    'Phone Number': '9876543214',
    'Email': 'admin@echopharma.com',
    'City': 'Jabalpur',
    'Pincode': '482001',
    'Address': '56 Civil Lines',
    'Product ID': 'PROD-001',
    'Product Code': 'JIO-FIBER',
    'Product Name': 'Enterprise Fiber Line',
    'Quantity': 0, // Invalid quantity for error testing
    'Requirement': 'Test invalid quantity error row',
    'Lead Source': 'Web Campaign',
    'Expected Value': 0,
    'GST Number': '23EEEEE7890E1Z9',
    'Priority': 'Low',
    'Dealer Type': 'Direct Client'
  }
];

const worksheet = XLSX.utils.json_to_sheet(sampleRows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM_Import_Test_Data');

const outputPath = path.join(process.cwd(), 'sample_crm_test_import.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('Sample Excel file generated successfully at:', outputPath);
