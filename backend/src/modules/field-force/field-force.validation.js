import { z } from 'zod';

export const checkInSchema = z.object({
  location: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    address: z.string().optional(),
  }),
});

export const planVisitSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["COLD_CALL", "FOLLOW_UP", "MEETING", "DEMO"]).optional(),
  scheduledAt: z.string().datetime(),
  location: z.record(z.any()).optional(),
  notes: z.string().optional(),
  customerId: z.string().uuid().optional(),
});

export const completeVisitSchema = z.object({
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
});


export const logExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['TRAVEL', 'MEALS', 'ACCOMMODATION', 'OTHER']),
  date: z.string().datetime(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

// Additional validation schemas for GET/LIST endpoints
export const filterSchema = z.object({
  query: z.object({
    skip: z.string().optional(),
    take: z.string().optional(),
    userId: z.string().uuid().optional(),
    status: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

export const darSchema = z.object({
  totalVisits: z.number().default(0),
  totalOrders: z.number().default(0),
  summary: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional(),
});

export const createTaskSchema = {
  body: z.object({
    assignedToId: z.string().uuid(),
    title: z.string().min(3),
    description: z.string().optional(),
    priority: z.enum([
      'LOW',
      'MEDIUM',
      'HIGH',
      'URGENT'
    ]).default('MEDIUM'),
    dueDate: z.string().datetime().optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional()
  })
};

export const beatPlanSchema = z.object({
  title: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const calendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(['MEETING', 'CALL', 'REMINDER', 'EVENT']).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ASSIGNED',
    'ACCEPTED',
    'WAITING_FOR_WAREHOUSE_PICKUP',
    'STOCK_PICKED_UP',
    'IN_PROGRESS',
    'NAVIGATING',
    'ARRIVED',
    'CHECKED_IN',
    'DELIVERY_IN_PROGRESS',
    'PAYMENT_COLLECTED',
    'PHOTO_UPLOADED',
    'VISIT_NOTES_COMPLETED',
    'SIGNATURE_CAPTURED',
    'INVOICE_GENERATED',
    'CHECKED_OUT',
    'COMPLETED',
    'CANCELLED'
  ]),
  location: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    address: z.string().optional(),
    accuracy: z.number().optional(),
  }).optional(),
  notes: z.string().optional(),
  completionNotes: z.string().optional(),
  payment: z.object({
    amount: z.coerce.number().positive(),
    method: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
  photoUrl: z.string().optional(),
  signature: z.string().optional(),
});