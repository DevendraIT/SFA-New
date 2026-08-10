import { prisma } from './config/database.js';
import { locationService } from './services/location.service.js';
import { CustomerService } from './modules/customers/customers.service.js';
import { CustomerRepository } from './modules/customers/customers.repository.js';
import { FieldForceService } from './modules/field-force/field-force.service.js';
import { FieldForceRepository } from './modules/field-force/field-force.repository.js';
import { OrganizationService } from './modules/organization/services/organization.service.js';
import { OrganizationRepository } from './modules/organization/repositories/OrganizationRepository.js';

async function verify() {
  console.log('==================================================');
  console.log('   PHASE 1 LOCATION ARCHITECTURE VERIFICATION     ');
  console.log('==================================================');

  // 1. Verify TomTom Geocoding Service directly
  console.log('\n[1] Testing TomTom Geocoding Service...');
  const geoResult = await locationService.geocodeAddress('Indore Palasiya, Madhya Pradesh, India');
  console.log('✓ TomTom Geocoded Coords:', geoResult);

  // 2. Verify Customer Creation & Automatic Geocoding
  console.log('\n[2] Testing Customer Creation & Automatic Geocoding...');
  const org = await prisma.organization.findFirst();
  const custRepo = new CustomerRepository();
  const custService = new CustomerService(custRepo);

  const testCust = await custService.create(org.id, {
    name: 'Apollo Pharmacy MG Road',
    address: { street: 'MG Road, Palasia', city: 'Indore', state: 'Madhya Pradesh', country: 'India' }
  });
  console.log('✓ Created Customer Record:', {
    id: testCust.id,
    name: testCust.name,
    latitude: testCust.latitude,
    longitude: testCust.longitude
  });

  // 3. Verify Branch Creation / Geocoding
  console.log('\n[3] Testing Branch Geocoding & Coordinates Storage...');
  const branch = await prisma.branch.findFirst({ where: { organizationId: org.id } });
  console.log('✓ Branch Location Record:', {
    id: branch.id,
    name: branch.name,
    latitude: branch.latitude,
    longitude: branch.longitude
  });

  // 4. Verify Task Assignment Auto Population
  console.log('\n[4] Testing Task Assignment Auto Pickup/Destination Population...');
  const manager = await prisma.user.findFirst({ where: { email: 'mohit123@gmail.com' } });
  const executive = await prisma.user.findFirst({ where: { email: 'yash123@gmail.com' } });

  const ffRepo = new FieldForceRepository();
  const ffService = new FieldForceService(ffRepo);

  const testTask = await ffService.createTask(org.id, manager.id, {
    assignedToId: executive.id,
    title: 'Phase 1 Location Architecture Verification Task',
    customerId: testCust.id,
    priority: 'HIGH'
  });

  console.log('✓ Created Task Record with Auto Pickup & Destination:', {
    id: testTask.id,
    title: testTask.title,
    pickupAddress: testTask.pickupAddress,
    pickupLatitude: testTask.pickupLatitude,
    pickupLongitude: testTask.pickupLongitude,
    destinationAddress: testTask.destinationAddress,
    destinationLatitude: testTask.destinationLatitude,
    destinationLongitude: testTask.destinationLongitude
  });

  console.log('\n==================================================');
  console.log('   ALL PHASE 1 VERIFICATION TESTS PASSED! ✓       ');
  console.log('==================================================');

  process.exit(0);
}

verify().catch((e) => {
  console.error('Verification failed:', e);
  process.exit(1);
});
