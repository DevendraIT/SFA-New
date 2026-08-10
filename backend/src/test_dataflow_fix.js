import { prisma } from './config/database.js';
import { FieldForceService } from './modules/field-force/field-force.service.js';
import { FieldForceRepository } from './modules/field-force/field-force.repository.js';
import { CustomerService } from './modules/customers/customers.service.js';
import { CustomerRepository } from './modules/customers/customers.repository.js';

async function testDataflow() {
  console.log('Testing Task Creation & Map Dataflow Fix...');
  const org = await prisma.organization.findFirst();
  const manager = await prisma.user.findFirst({ where: { email: 'mohit123@gmail.com' } });
  const executive = await prisma.user.findFirst({ where: { email: 'yash123@gmail.com' } });

  // 1. Create a new Customer in a different location (e.g. Vijay Nagar, Indore)
  const custService = new CustomerService(new CustomerRepository());
  const newCust = await custService.create(org.id, {
    name: 'Apollo Pharmacy Vijay Nagar Branch',
    address: { street: 'Scheme No 54, Vijay Nagar', city: 'Indore', state: 'Madhya Pradesh', country: 'India' }
  });

  console.log('✓ Created New Customer:', {
    id: newCust.id,
    name: newCust.name,
    latitude: newCust.latitude,
    longitude: newCust.longitude
  });

  // 2. Create Task selecting this new Customer
  const ffService = new FieldForceService(new FieldForceRepository());
  const newTask = await ffService.createTask(org.id, manager.id, {
    assignedToId: executive.id,
    title: 'Dataflow Verification - New Branch & Customer Task',
    customerId: newCust.id,
    priority: 'HIGH'
  });

  console.log('✓ Created New Task with Location Coords:', {
    id: newTask.id,
    title: newTask.title,
    pickupAddress: newTask.pickupAddress,
    pickupLatitude: newTask.pickupLatitude,
    pickupLongitude: newTask.pickupLongitude,
    destinationAddress: newTask.destinationAddress,
    destinationLatitude: newTask.destinationLatitude,
    destinationLongitude: newTask.destinationLongitude
  });

  if (newTask.destinationLatitude && newTask.destinationLongitude && newTask.pickupLatitude && newTask.pickupLongitude) {
    console.log('SUCCESS: Task contains non-null Pickup & Destination Coordinates!');
  } else {
    throw new Error('Task destination or pickup coordinates are null!');
  }

  process.exit(0);
}

testDataflow().catch((e) => {
  console.error(e);
  process.exit(1);
});
