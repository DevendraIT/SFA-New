import 'dotenv/config';
import { prisma } from '../src/config/database.js';
import { franchiseService } from '../src/modules/franchise/services/franchise.service.js';
import { authService } from '../src/modules/auth/auth.routes.js';

async function testFranchisePipeline() {
  console.log('--- TESTING FRANCHISE ADMIN & PROVISIONING PIPELINE ---');

  try {
    // 1. Authenticate Franchise Admin
    console.log('Step 1: Testing Franchise Admin authentication...');
    const authResult = await franchiseService.authenticateFranchise('franchise@it360.com', 'Franchise@123');
    console.log('✓ Franchise Admin authenticated successfully! Token generated:', authResult.token ? 'YES' : 'NO');
    console.log('  Franchise Name:', authResult.franchise.name);

    // 2. Provision new Client Organization + Super Admin
    console.log('\nStep 2: Testing Organization & Super Admin provisioning...');
    const testOrgName = `Beta Retail Test Corp ${Date.now()}`;
    const testAdminEmail = `beta.superadmin.${Date.now()}@testcorp.com`;

    const provisionResult = await franchiseService.provisionOrganizationAndSuperAdmin({
      franchiseId: authResult.franchise.id,
      organizationData: {
        name: testOrgName,
        email: 'info@testcorp.com',
        phone: '9876543210',
        city: 'Pune',
        state: 'Maharashtra',
      },
      superAdminData: {
        firstName: 'Beta',
        lastName: 'Admin',
        email: testAdminEmail,
        password: 'SuperPassword@123',
      },
    });

    console.log('✓ Organization provisioned successfully!');
    console.log('  Org ID:', provisionResult.organization.id);
    console.log('  Org Name:', provisionResult.organization.name);
    console.log('  Super Admin Email:', provisionResult.superAdmin.email);
    console.log('  Super Admin Role:', provisionResult.superAdmin.role);

    // 3. Verify that standard roles exist for this organization
    console.log('\nStep 3: Verifying auto-seeded enterprise roles for new organization...');
    const roles = await prisma.role.findMany({
      where: { organizationId: provisionResult.organization.id },
    });
    console.log(`✓ Found ${roles.length} roles auto-created for this organization:`, roles.map((r) => r.name).join(', '));

    // 4. Test client Super Admin login via standard SFA authService
    console.log('\nStep 4: Testing newly provisioned Super Admin login via standard SFA auth...');
    const userAuth = await authService.login(
      {
        email: testAdminEmail,
        password: 'SuperPassword@123',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'Node Test Agent',
      }
    );
    console.log('✓ Super Admin logged in via standard SFA login successfully!');
    console.log('  User Name:', `${userAuth.user.firstName} ${userAuth.user.lastName}`);
    console.log('  Organization ID:', userAuth.user.organizationId);
    console.log('  Primary Role:', userAuth.user.roles?.[0]?.role?.name);

    // 5. Test Franchise organizations list & metrics
    console.log('\nStep 5: Testing Franchise Organizations list & metrics...');
    const orgsList = await franchiseService.getOrganizationsByFranchise(authResult.franchise.id);
    const metrics = await franchiseService.getFranchiseMetrics(authResult.franchise.id);
    console.log(`✓ Franchise currently has ${orgsList.length} organization(s) under management.`);
    console.log('  Metrics:', metrics);

    // 6. Test SSO Token generation for IT360
    console.log('\nStep 6: Testing IT360 Direct SSO Token Generation...');
    const ssoResult = await franchiseService.generateSuperAdminSsoToken(
      authResult.franchise.id,
      provisionResult.organization.id
    );
    console.log('✓ SSO token generated successfully! Token present:', !!ssoResult.ssoToken);
    console.log('  Target Super Admin:', ssoResult.superAdmin.email);

    // 7. Cleanup the test organization
    console.log('\nStep 7: Cleaning up test organization...');
    await prisma.organization.delete({
      where: { id: provisionResult.organization.id },
    });
    console.log('✓ Test organization cleaned up successfully.');

    console.log('\n🎉 ALL FRANCHISE & PROVISIONING PIPELINE TESTS PASSED 100%!');
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFranchisePipeline();
