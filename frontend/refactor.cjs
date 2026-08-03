const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const replacements = [
  { from: /companyId/g, to: 'organizationId' },
  { from: /companyName/g, to: 'organizationName' },
  { from: /companyEmail/g, to: 'organizationEmail' },
  { from: /companyPhone/g, to: 'organizationPhone' },
  { from: /companyAddress/g, to: 'organizationAddress' },
  { from: /CompanyPage/g, to: 'OrganizationPage' },
  { from: /CompanyForm/g, to: 'OrganizationForm' },
  { from: /CompanyTable/g, to: 'OrganizationTable' },
  { from: /CompanyModal/g, to: 'OrganizationModal' },
  { from: /CompanyDialog/g, to: 'OrganizationDialog' },
  { from: /CompanyCard/g, to: 'OrganizationCard' },
  { from: /useCompany/g, to: 'useOrganization' },
  { from: /useCompanies/g, to: 'useOrganizations' },
  { from: /company\.api/g, to: 'organization.api' },
  { from: /company\.service/g, to: 'organization.service' },
  { from: /\/company/g, to: '/organization' },
  { from: /\/companies/g, to: '/organizations' },
  { from: /Companies/g, to: 'Organizations' },
  { from: /companies/g, to: 'organizations' },
  { from: /COMPANIES/g, to: 'ORGANIZATIONS' },
  { from: /COMPANY/g, to: 'ORGANIZATION' },
  { from: /Company/g, to: 'Organization' },
  { from: /company/g, to: 'organization' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx|css|html|json)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { from, to } of replacements) {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Modified: ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Refactor script completed.');
