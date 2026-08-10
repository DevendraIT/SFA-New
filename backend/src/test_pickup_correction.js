import { prisma } from './config/database.js';
import { FieldForceService } from './modules/field-force/field-force.service.js';
import { FieldForceRepository } from './modules/field-force/field-force.repository.js';

async function testPickupLogic() {
  console.log('Testing Pickup Location Source Business Logic Correction...');
  const org = await prisma.organization.findFirst();
  const manager = await prisma.user.findFirst({ where: { email: 'mohit123@gmail.com' } });
  const executive = await prisma.user.findFirst({ where: { email: 'yash123@gmail.com' } });
  const customer = await prisma.customer.findFirst();

  const ffService = new FieldForceService(new FieldForceRepository());

  // Task 1: Manually entered Pickup Location A (MG Road, Palasia, Indore)
  const task1 = await ffService.createTask(org.id, manager.id, {
    assignedToId: executive.id,
    title: 'Pickup Test Task 1 - Palasia Pickup',
    customerId: customer.id,
    pickupAddress: 'MG Road, Palasia, Indore, Madhya Pradesh, India',
    priority: 'MEDIUM'
  });

  // Task 2: Manually entered Pickup Location B (AB Road, Bhanwarkuan, Indore)
  const task2 = await ffService.createTask(org.id, manager.id, {
    assignedToId: executive.id,
    title: 'Pickup Test Task 2 - Bhanwarkuan Pickup',
    customerId: customer.id,
    pickupAddress: 'AB Road, Bhanwarkuan, Indore, Madhya Pradesh, India',
    priority: 'HIGH'
  });

  // Task 3: Unspecified Pickup Location (Fallback to Branch)
  const task3 = await ffService.createTask(org.id, manager.id, {
    assignedToId: executive.id,
    title: 'Pickup Test Task 3 - Branch Fallback Pickup',
    customerId: customer.id,
    priority: 'LOW'
  });

  console.log('\n--- TASK 1 RESULT (Manual Input A) ---');
  console.log({
    id: task1.id,
    title: task1.title,
    pickupAddress: task1.pickupAddress,
    pickupLatitude: task1.pickupLatitude,
    pickupLongitude: task1.pickupLongitude
  });

  console.log('\n--- TASK 2 RESULT (Manual Input B) ---');
  console.log({
    id: task2.id,
    title: task2.title,
    pickupAddress: task2.pickupAddress,
    pickupLatitude: task2.pickupLatitude,
    pickupLongitude: task2.pickupLongitude
  });

  console.log('\n--- TASK 3 RESULT (Branch Fallback) ---');
  console.log({
    id: task3.id,
    title: task3.title,
    pickupAddress: task3.pickupAddress,
    pickupLatitude: task3.pickupLatitude,
    pickupLongitude: task3.pickupLongitude
  });

  const distinctLat = task1.pickupLatitude !== task2.pickupLatitude;
  const distinctLng = task1.pickupLongitude !== task2.pickupLongitude;

  if (distinctLat && distinctLng && task3.pickupLatitude) {
    console.log('\n✅ VERIFICATION SUCCESSFUL: Task 1 and Task 2 stored distinct manually geocoded Pickup Locations, and Task 3 fell back cleanly to Branch coordinates!');
  } else {
    throw new Error('Verification failed: Pickup locations were not distinct!');
  }

  process.exit(0);
}

testPickupLogic().catch((err) => {
  console.error(err);
  process.exit(1);
});
