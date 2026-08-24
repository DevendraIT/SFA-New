import { AppError } from '../../shared/response.js';
import config from "../../config/env.js";
import cacheService from '../../shared/cache/cache.service.js';

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export class FieldForceService {
  constructor(fieldForceRepository) {
    this.repo = fieldForceRepository;
  }

  _invalidateFieldForce(orgId, userId = null) {
    if (!orgId) return;
    cacheService.invalidatePrefixes([
      `${orgId}:fieldforce:`,
      `${orgId}:dashboard:`,
      `${orgId}:inventory:`,
    ]);
  }

  async checkIn(organizationId, userId, data) {
    if (!data.location || !data.location.lat || !data.location.lng) {
      throw AppError.badRequest('GPS Verification Failed: Location coordinates are required to check in.');
    }

    const attendance = await this.repo.checkIn(organizationId, userId, data);
    this._invalidateFieldForce(organizationId, userId);
    return attendance;
  }

  async checkOut(organizationId, userId, data) {
    const attendance = await this.repo.checkOut(organizationId, userId, data);
    this._invalidateFieldForce(organizationId, userId);
    return attendance;
  }

  async planVisit(organizationId, userId, data) {
    const visit = await this.repo.createVisit(organizationId, userId, data);
    this._invalidateFieldForce(organizationId, userId);
    return visit;
  }

  async startVisit(visitId, organizationId, userId) {
    const visit = await this.repo.updateVisitStatus(visitId, organizationId, 'IN_PROGRESS');
    this._invalidateFieldForce(organizationId, userId);
    return visit;
  }

  async completeVisit(visitId, organizationId, userId, data) {
    const visit = await this.repo.updateVisitStatus(visitId, organizationId, 'COMPLETED', data);
    this._invalidateFieldForce(organizationId, userId);
    return visit;
  }

  async addVisitNotes(visitId, organizationId, notes) {
    return this.repo.updateVisitStatus(visitId, organizationId, undefined, { notes });
  }

  async uploadVisitPhoto(visitId, organizationId, photoUrl) {
    return this.repo.updateVisitStatus(visitId, organizationId, undefined, { photoUrl });
  }

  async logExpense(organizationId, userId, data) {
    return this.repo.createExpense(organizationId, userId, data);
  }

  async createTask(organizationId, userId, data) {
    const { prisma } = await import('../../config/database.js');
    const { locationService } = await import('../../services/location.service.js');

    const taskPayload = { ...data };

    // 1. Populate Pickup Location: Primary = data.pickupAddress (Sales Manager input), Fallback = Branch
    if (data.pickupAddress && typeof data.pickupAddress === 'string' && data.pickupAddress.trim().length > 0) {
      const inputPickupAddress = data.pickupAddress.trim();
      let pLat = data.pickupLatitude ? Number(data.pickupLatitude) : null;
      let pLng = data.pickupLongitude ? Number(data.pickupLongitude) : null;
      let formattedAddress = inputPickupAddress;

      if (pLat == null || pLng == null) {
        try {
          const geo = await locationService.geocodeAddress(inputPickupAddress);
          if (geo?.latitude && geo?.longitude) {
            pLat = geo.latitude;
            pLng = geo.longitude;
            if (geo.address) {
              formattedAddress = geo.address;
            }
          }
        } catch (e) {
          console.warn('TomTom pickup location geocoding warning:', e.message);
        }

        // Backup Geocoding Fallback via OpenStreetMap Nominatim
        if (pLat == null || pLng == null) {
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputPickupAddress)}&limit=1`, {
              headers: { 'Accept-Language': 'en', 'User-Agent': 'SFA-FieldForceApp/1.0' }
            });
            const geoData = await geoRes.json();
            if (Array.isArray(geoData) && geoData.length > 0) {
              pLat = parseFloat(geoData[0].lat);
              pLng = parseFloat(geoData[0].lon);
            }
          } catch (e) {
            console.warn('Backup Nominatim geocoding failed:', e.message);
          }
        }
      }

      taskPayload.pickupAddress = formattedAddress;
      taskPayload.pickupLatitude = pLat;
      taskPayload.pickupLongitude = pLng;
    } else {
      // Fallback: Populate Pickup Location from selected/assigned Branch
      const managerUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          branchId: true,
          branch: {
            select: { id: true, name: true, address: true, city: true, state: true, country: true, latitude: true, longitude: true }
          }
        }
      });

      const targetBranch = data.branchId
        ? await prisma.branch.findUnique({ where: { id: data.branchId } })
        : managerUser?.branch;

      if (targetBranch) {
        let bLat = targetBranch.latitude;
        let bLng = targetBranch.longitude;
        const bAddrStr = [targetBranch.address, targetBranch.city, targetBranch.state, targetBranch.country].filter(Boolean).join(', ');

        if ((!bLat || !bLng) && bAddrStr) {
          try {
            const geo = await locationService.geocodeAddress(bAddrStr);
            bLat = geo.latitude;
            bLng = geo.longitude;
            await prisma.branch.update({ where: { id: targetBranch.id }, data: { latitude: bLat, longitude: bLng } });
          } catch (e) {
            // Retain address string if geocoding fails
          }
        }

        taskPayload.pickupAddress = bAddrStr || targetBranch.name || 'Branch Location';
        taskPayload.pickupLatitude = bLat;
        taskPayload.pickupLongitude = bLng;
      }
    }

    // 2. Automatically populate Destination Location from Customer
    let targetCustomerId = data.customerId || (data.referenceType === 'CUSTOMER' ? data.referenceId : null);
    if (!targetCustomerId && (data.referenceType === 'ORDER' || data.orderId || data.referenceId)) {
      const orderIdToLookup = data.orderId || data.referenceId;
      if (orderIdToLookup) {
        const orderRecord = await prisma.order.findUnique({
          where: { id: orderIdToLookup },
          select: { customerId: true }
        });
        if (orderRecord?.customerId) {
          targetCustomerId = orderRecord.customerId;
        }
      }
    }

    if (targetCustomerId) {
      const customer = await prisma.customer.findUnique({ where: { id: targetCustomerId } });
      if (customer) {
        let cLat = customer.latitude;
        let cLng = customer.longitude;

        let cAddrStr = null;
        if (typeof customer.address === 'string') {
          cAddrStr = customer.address;
        } else if (typeof customer.address === 'object' && customer.address) {
          const parts = [
            customer.address.street || customer.address.addressLine1 || customer.address.address,
            customer.address.city,
            customer.address.state,
            customer.address.postalCode || customer.address.zipCode,
            customer.address.country
          ].filter(Boolean);
          cAddrStr = parts.join(', ');
        }

        if ((!cLat || !cLng) && cAddrStr) {
          try {
            const geo = await locationService.geocodeAddress(cAddrStr);
            cLat = geo.latitude;
            cLng = geo.longitude;
            await prisma.customer.update({ where: { id: customer.id }, data: { latitude: cLat, longitude: cLng } });
          } catch (e) {
            // Retain address string if geocoding fails
          }
        }

        taskPayload.destinationAddress = cAddrStr || customer.name || 'Customer Destination';
        taskPayload.destinationLatitude = cLat;
        taskPayload.destinationLongitude = cLng;
      }
    }

    const task = await this.repo.createTask(organizationId, userId, taskPayload);

    // Create ProductIssue records for Warehouse Manager stock pickup if task contains products
    try {
      const meta = (taskPayload.metadata && typeof taskPayload.metadata === 'object')
        ? taskPayload.metadata
        : ((data.metadata && typeof data.metadata === 'object')
          ? data.metadata
          : (task.metadata && typeof task.metadata === 'object' ? task.metadata : (typeof task.metadata === 'string' ? JSON.parse(task.metadata) : {})));
      let prods = Array.isArray(meta?.products) ? meta.products : (typeof meta === 'string' ? JSON.parse(meta)?.products : []);
      const targetOrderId = data.orderId || data.referenceId || task.referenceId || task.orderId;
      if ((!prods || prods.length === 0) && targetOrderId) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: targetOrderId },
          include: { product: true }
        });
        prods = orderItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity || 1),
          name: item.product?.name || item.description
        }));
      }
      console.log('createTask prods extracted:', prods);
      if (prods && prods.length > 0 && task.assignedToId) {
        // Resolve Executive's branch warehouse
        const execUser = await prisma.user.findUnique({
          where: { id: task.assignedToId },
          select: { branchId: true }
        });
        const targetBranchId = execUser?.branchId || task.branchId;
        let targetWarehouse = targetBranchId
          ? await prisma.warehouse.findFirst({ where: { branches: { some: { id: targetBranchId } } }, include: { warehouseManager: true } })
          : null;

        if (!targetWarehouse) {
          targetWarehouse = await prisma.warehouse.findFirst({ where: { organizationId, isActive: true }, include: { warehouseManager: true } });
        }

        console.log('targetBranchId:', targetBranchId, 'targetWarehouse resolved:', targetWarehouse?.id, targetWarehouse?.name);
        if (targetWarehouse) {
          for (const prodItem of prods) {
            let pId = prodItem.productId || prodItem.id;
            let matchedProd = null;
            if (pId) {
              matchedProd = await prisma.product.findFirst({ where: { id: pId, organizationId } });
            }
            if (!matchedProd && prodItem.name) {
              matchedProd = await prisma.product.findFirst({
                where: { organizationId, name: { equals: prodItem.name, mode: 'insensitive' } }
              });
            }
            if (!matchedProd) {
              matchedProd = await prisma.product.findFirst({ where: { organizationId } });
            }

            if (matchedProd) {
              const reqQty = Number(prodItem.quantity || 1);
              await prisma.productIssue.create({
                data: {
                  organizationId,
                  warehouseId: targetWarehouse.id,
                  productId: matchedProd.id,
                  salesExecutiveId: task.assignedToId,
                  quantity: reqQty > 0 ? reqQty : 1,
                  status: 'PENDING',
                  notes: `Stock pickup request for task "${task.title}" (Ref: ${task.id})`,
                }
              }).catch(err => console.error('Failed to create ProductIssue for task:', err));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to process task stock pickup requests:', e);
    }

    try {
      const { notificationsService } = await import('../notifications/notifications.routes.js');
      if (task?.assignedToId) {
        await notificationsService.sendNotification(organizationId, task.assignedToId, {
          title: 'New Field Mission Assigned 🎯',
          message: `You have been assigned a new mission: "${task.title}".`,
          type: 'IN_APP',
          referenceType: 'TASK',
          referenceId: task.id,
        });
      }
    } catch (e) {
      console.warn('Failed to send task assignment notification:', e);
    }

    // 3. Automated Customer Delivery OTP Generation & Email Dispatch if required
    try {
      const metaReqs = (typeof taskPayload.metadata === 'object' && taskPayload.metadata) ? (taskPayload.metadata.requirements || {}) : {};
      const requiresOtp = data.requireOtp === true || 
                          taskPayload.requireOtp === true ||
                          taskPayload.requirements?.requireOtp === true || 
                          taskPayload.requirements?.otp === true || 
                          metaReqs.requireOtp === true || 
                          metaReqs.otp === true || 
                          taskPayload.metadata?.requireOtp === true;

      if (requiresOtp) {
        const deliveryOtp = String(Math.floor(100000 + Math.random() * 900000));
        let customerEmail = data.customerEmail || taskPayload.metadata?.customer?.email || taskPayload.customerEmail;
        let customerName = data.customerName || taskPayload.metadata?.customer?.name || 'Customer';

        const targetCustomerId = data.customerId || taskPayload.customerId || (task.referenceType === 'CUSTOMER' ? task.referenceId : taskPayload.metadata?.customer?.id);
        const targetOrderId = data.orderId || taskPayload.orderId || (task.referenceType === 'ORDER' ? task.referenceId : taskPayload.metadata?.orderId);

        if ((!customerEmail || !customerEmail.includes('@')) && targetCustomerId) {
          const dbCust = await prisma.customer.findUnique({
            where: { id: targetCustomerId },
            select: { email: true, name: true }
          });
          if (dbCust?.email) {
            customerEmail = dbCust.email;
            if (dbCust.name) customerName = dbCust.name;
          }
        }

        if ((!customerEmail || !customerEmail.includes('@')) && targetOrderId) {
          const dbOrder = await prisma.order.findUnique({
            where: { id: targetOrderId },
            include: { customer: true }
          });
          if (dbOrder?.customer?.email) {
            customerEmail = dbOrder.customer.email;
            if (dbOrder.customer.name) customerName = dbOrder.customer.name;
          }
        }

        const existingMeta = (typeof task.metadata === 'object' && task.metadata) ? task.metadata : {};
        const existingReqs = (typeof existingMeta.requirements === 'object' && existingMeta.requirements) ? existingMeta.requirements : {};

        const updatedMetadata = {
          ...existingMeta,
          requireOtp: true,
          requirements: {
            ...existingReqs,
            requireOtp: true,
            otp: true,
          },
          customer: {
            ...(existingMeta.customer || {}),
            email: customerEmail || existingMeta.customer?.email,
            name: customerName || existingMeta.customer?.name,
          },
          deliveryOtp,
          deliveryOtpStatus: 'SENT',
          deliveryOtpVerified: false,
          deliveryOtpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        const updatedTask = await prisma.task.update({
          where: { id: task.id },
          data: { metadata: updatedMetadata }
        });

        if (customerEmail && customerEmail.includes('@')) {
          const emailService = (await import('../../shared/email/email.service.js')).default;
          await emailService.sendDeliveryOtpEmail(customerEmail, customerName, deliveryOtp, task.title)
            .catch(err => console.warn('Customer delivery OTP email dispatch warning:', err.message));
        }

        return updatedTask;
      }
    } catch (e) {
      console.warn('Delivery OTP initialization warning:', e.message);
    }

    return task;
  }

  async sendDeliveryOtp(taskId, organizationId) {
    const { prisma } = await import('../../config/database.js');
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId }
    });

    if (!task) throw AppError.notFound('Task not found.');

    const metadata = typeof task.metadata === 'object' && task.metadata !== null ? task.metadata : {};
    let customerEmail = metadata.customer?.email || task.customerEmail;
    let customerName = metadata.customer?.name || task.customerName || 'Customer';

    const targetCustomerId = metadata.customer?.id || (task.referenceType === 'CUSTOMER' ? task.referenceId : null);
    const targetOrderId = metadata.orderId || (task.referenceType === 'ORDER' ? task.referenceId : null);

    if ((!customerEmail || !customerEmail.includes('@')) && targetCustomerId) {
      const dbCust = await prisma.customer.findUnique({
        where: { id: targetCustomerId },
        select: { email: true, name: true }
      });
      if (dbCust?.email) {
        customerEmail = dbCust.email;
        if (dbCust.name) customerName = dbCust.name;
      }
    }

    if ((!customerEmail || !customerEmail.includes('@')) && targetOrderId) {
      const dbOrder = await prisma.order.findUnique({
        where: { id: targetOrderId },
        include: { customer: true }
      });
      if (dbOrder?.customer?.email) {
        customerEmail = dbOrder.customer.email;
        if (dbOrder.customer.name) customerName = dbOrder.customer.name;
      }
    }

    if (!customerEmail || !customerEmail.includes('@')) {
      throw AppError.badRequest('No valid customer email address found for this task. Please update customer email.');
    }

    const deliveryOtp = String(Math.floor(100000 + Math.random() * 900000));
    const updatedMetadata = {
      ...metadata,
      deliveryOtp,
      deliveryOtpStatus: 'SENT',
      deliveryOtpVerified: false,
      deliveryOtpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    await prisma.task.update({
      where: { id: taskId },
      data: { metadata: updatedMetadata }
    });

    const emailService = (await import('../../shared/email/email.service.js')).default;
    await emailService.sendDeliveryOtpEmail(customerEmail, customerName, deliveryOtp, task.title);

    return {
      success: true,
      message: `Delivery OTP sent successfully to ${customerEmail}`,
      customerEmail,
    };
  }

  async verifyDeliveryOtp(taskId, organizationId, otp) {
    const { prisma } = await import('../../config/database.js');
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId }
    });

    if (!task) throw AppError.notFound('Task not found.');

    const metadata = typeof task.metadata === 'object' && task.metadata !== null ? task.metadata : {};
    const storedOtp = metadata.deliveryOtp;

    if (!storedOtp || String(storedOtp).trim() !== String(otp).trim()) {
      throw AppError.badRequest('Invalid Delivery OTP. Please ask the customer for the correct code.');
    }

    const existingHistory = Array.isArray(metadata.executionHistory) ? metadata.executionHistory : [];
    const newHistoryEntry = {
      status: 'CUSTOMER_OTP_VERIFIED',
      timestamp: new Date().toISOString(),
      notes: 'Customer Delivery OTP verified successfully',
    };

    const updatedMetadata = {
      ...metadata,
      deliveryOtpVerified: true,
      deliveryOtpVerifiedAt: new Date().toISOString(),
      deliveryOtpStatus: 'VERIFIED',
      executionHistory: [...existingHistory, newHistoryEntry],
    };

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        metadata: updatedMetadata
      }
    });

    this._invalidateFieldForce(organizationId);

    return {
      success: true,
      verified: true,
      message: 'Customer Delivery OTP verified successfully!',
      task: updatedTask,
    };
  }

  async generateDar(organizationId, userId, data) {
    const { prisma } = await import('../../config/database.js');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // const [visitsCount, ordersCount] = await Promise.all([
    //   prisma.visit.count({
    //     where: {
    //       organizationId,
    //       userId,
    //       scheduledAt: { gte: today, lt: tomorrow },
    //     }
    //   }),
    //   prisma.order.count({
    //     where: {
    //       organizationId,
    //       ownerId: userId,
    //       createdAt: { gte: today, lt: tomorrow },
    //       isDeleted: false,
    //     }
    //   })
    // ]);

    const visitsCount = await prisma.visit.count({
      where: {
        organizationId,
        userId,
      },
    });

    const ordersCount = await prisma.order.count({
      where: {
        organizationId,
        ownerId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        isDeleted: false,
      },
    });

    const darData = {
      ...data,
      totalVisits: visitsCount,
      totalOrders: ordersCount,
    };

    return this.repo.createDar(organizationId, userId, darData);
  }

  async createBeatPlan(organizationId, userId, data) {
    return this.repo.createBeatPlan(organizationId, userId, data);
  }

  async assignBeatPlan(organizationId, managerId, data) {
    if (!data.assignedTo) {
      throw AppError.badRequest('Subordinate user ID is required to assign a beat plan.');
    }
    return this.repo.createBeatPlan(organizationId, data.assignedTo, data);
  }

  async approveBeatPlan(planId, organizationId, userId) {
    return this.repo.updateBeatPlanStatus(planId, organizationId, 'APPROVED');
  }

  async createCalendarEvent(organizationId, userId, data) {
    return this.repo.createCalendarEvent(organizationId, userId, data);
  }

  async optimizeRoute(organizationId, userId, visitIds) {
    const { prisma } = await import('../../config/database.js');

    // Sort visits chronologically based on database records instead of faking a map route
    const visits = await prisma.visit.findMany({
      where: {
        organizationId,
        id: { in: visitIds }
      },
      orderBy: { scheduledAt: 'asc' },
      select: { id: true, scheduledAt: true }
    });

    return {
      optimizedOrder: visits.map(v => v.id),
      estimatedDistance: 'N/A (Maps Disabled)',
      estimatedDuration: 'N/A (Maps Disabled)'
    };
  }

  //   async testTomTom() {

  //   const address = "Indore";

  //   const url =
  //     `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${config.TOMTOM_API_KEY}`;

  //   console.log("TomTom API Key:", config.TOMTOM_API_KEY);
  //   console.log("URL:", url);

  //   const response = await fetch(url);

  //   const data = await response.json();

  //   console.log(data);

  //   return data;
  // }


  // ===== GET/LIST SERVICE METHODS =====

  async getAttendance(organizationId, userId, date) {
    return this.repo.getAttendance(organizationId, userId, date);
  }

  async listAttendance(organizationId, filters = {}) {
    return this.repo.listAttendance(organizationId, filters);
  }

  async getVisit(visitId, organizationId) {
    const visit = await this.repo.getVisit(visitId, organizationId);
    if (!visit) throw AppError.notFound('Visit not found');
    return visit;
  }

  async listVisits(organizationId, filters = {}) {
    return this.repo.listVisits(organizationId, filters);
  }

  async getExpense(expenseId, organizationId) {
    const expense = await this.repo.getExpense(expenseId, organizationId);
    if (!expense) throw AppError.notFound('Expense not found');
    return expense;
  }

  async listExpenses(organizationId, filters = {}) {
    return this.repo.listExpenses(organizationId, filters);
  }

  async approveExpense(expenseId, organizationId, userId) {
    const expense = await this.getExpense(expenseId, organizationId);
    const updated = await this.repo.updateExpenseStatus(expenseId, organizationId, 'APPROVED', userId);


    return updated;
  }

  async rejectExpense(expenseId, organizationId) {
    return await this.repo.updateExpenseStatus(expenseId, organizationId, 'REJECTED');
  }

  async getDailyActivityReport(darId, organizationId) {
    const dar = await this.repo.getDailyActivityReport(darId, organizationId);
    if (!dar) throw AppError.notFound('Daily Activity Report not found');
    return dar;
  }

  async listDailyActivityReports(organizationId, filters = {}) {
    return this.repo.listDailyActivityReports(organizationId, filters);
  }

  async submitDailyActivityReport(darId, organizationId) {
    const dar = await this.getDailyActivityReport(darId, organizationId);
    const updated = await this.repo.updateDarStatus(darId, organizationId, 'SUBMITTED');


    return updated;
  }

  async approveDailyActivityReport(darId, organizationId) {
    return await this.repo.updateDarStatus(darId, organizationId, 'APPROVED');
  }

  async generateDar(organizationId, userId, payload = {}) {
    const { prisma } = await import('../../config/database.js');
    const today = payload.date ? new Date(payload.date) : new Date();
    const startOfDay = new Date(new Date(today).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(today).setHours(23, 59, 59, 999));

    // Fetch attendance, tasks, and visits for today
    const [attendance, tasks, visits] = await Promise.all([
      prisma.attendance.findFirst({
        where: { organizationId, userId, date: { gte: startOfDay, lte: endOfDay } }
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          assignedToId: userId,
          updatedAt: { gte: startOfDay, lte: endOfDay }
        }
      }),
      prisma.visit.findMany({
        where: {
          organizationId,
          userId,
          scheduledAt: { gte: startOfDay, lte: endOfDay }
        }
      })
    ]);

    const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'CHECKED_OUT');
    const totalPayments = tasks.reduce((sum, t) => sum + (t.paymentAmount || 0), 0);
    const totalPhotos = tasks.reduce((sum, t) => sum + (Array.isArray(t.photos) ? t.photos.length : (t.photos ? 1 : 0)), 0);

    const notesList = tasks.filter(t => t.visitNotes).map(t => `${t.title}: ${t.visitNotes}`).join('; ');
    const productsDeliveredList = tasks.flatMap(t => {
      const metadata = t.metadata || {};
      const prods = metadata.products || [];
      return prods.map(p => `${p.name} (x${p.quantity || 1})`);
    }).join(', ');

    const checkInTime = attendance?.checkInAt ? new Date(attendance.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    const checkOutTime = attendance?.checkOutAt ? new Date(attendance.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

    const dynamicSummary = payload.summary || [
      `Tasks: ${tasks.length} Assigned, ${completedTasks.length} Completed`,
      `Attendance: Check-In: ${checkInTime}, Check-Out: ${checkOutTime}`,
      `Visits: ${visits.length} Scheduled`,
      totalPayments > 0 ? `Payments Collected: ₹${totalPayments}` : null,
      totalPhotos > 0 ? `Photos Captured: ${totalPhotos}` : null,
      productsDeliveredList ? `Products Delivered: ${productsDeliveredList}` : null,
      notesList ? `Visit Notes: ${notesList}` : null
    ].filter(Boolean).join(' | ');

    return this.repo.upsertDailyActivityReport(organizationId, userId, startOfDay, {
      totalVisits: visits.length,
      totalOrders: completedTasks.length,
      totalAmount: totalPayments,
      summary: dynamicSummary,
      status: 'DRAFT'
    });
  }

  async getTask(taskId, organizationId) {
    const task = await this.repo.getTask(taskId, organizationId);
    if (!task) throw AppError.notFound('Task not found');

    const metadata = (typeof task.metadata === 'object' && task.metadata !== null) ? { ...task.metadata } : {};

    const orderId = task.referenceId || metadata.orderId || metadata.order?.id;
    if (orderId) {
      try {
        const { prisma } = await import('../../config/database.js');
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
            items: { include: { product: true } }
          }
        });
        if (order) {
          metadata.order = {
            id: order.id,
            orderNumber: order.orderNumber,
            orderName: order.orderName || order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            total: order.totalAmount,
            createdAt: order.createdAt,
            customer: order.customer,
            items: order.items.map(item => ({
              id: item.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              description: item.description,
              name: item.product?.name || item.description,
              sku: item.product?.sku
            }))
          };
          metadata.orderId = order.id;

          if (order.customer && !metadata.customer) {
            metadata.customer = order.customer;
          }
          if (order.items && order.items.length > 0 && (!metadata.products || metadata.products.length === 0)) {
            metadata.products = order.items.map(item => ({
              id: item.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              name: item.product?.name || item.description,
              sku: item.product?.sku
            }));
          }
        }
      } catch (e) {
        console.warn('Failed to populate linked order for task:', e);
      }
    }

    // Always refresh pickup location from current branch data
    // so changes to branch address are reflected immediately
    try {
      const { prisma } = await import('../../config/database.js');
      const assignedByUser = await prisma.user.findUnique({
        where: { id: task.assignedById },
        select: {
          branchId: true,
          branch: {
            select: { id: true, name: true, address: true, city: true, state: true, country: true, latitude: true, longitude: true }
          }
        }
      });

      const branch = assignedByUser?.branch;
      if (branch) {
        const freshAddr = [branch.address, branch.city, branch.state, branch.country].filter(Boolean).join(', ');
        if (freshAddr || branch.latitude || branch.longitude) {
          task.pickupAddress = freshAddr || branch.name || task.pickupAddress || 'Branch Location';
          task.pickupLatitude = branch.latitude ?? task.pickupLatitude;
          task.pickupLongitude = branch.longitude ?? task.pickupLongitude;

          // Silently persist updated pickup coords back to task row
          if (
            task.pickupAddress !== freshAddr ||
            task.pickupLatitude !== branch.latitude ||
            task.pickupLongitude !== branch.longitude
          ) {
            await prisma.task.update({
              where: { id: task.id },
              data: {
                pickupAddress: task.pickupAddress,
                pickupLatitude: task.pickupLatitude,
                pickupLongitude: task.pickupLongitude
              }
            }).catch(() => { }); // fire-and-forget, don't block response
          }
        }
      }
    } catch (e) {
      console.warn('Failed to refresh pickup from branch in getTask:', e.message);
    }

    return {
      ...task,
      metadata
    };
  }

  async listTasks(organizationId, filters = {}) {
    return this.repo.listTasks(organizationId, filters);
  }

  async completeTask(taskId, organizationId, data) {
    return await this.repo.completeTask(taskId, organizationId, data);
  }

  async updateTaskStatus(taskId, organizationId, userId, payload) {
    const task = await this.repo.getTask(taskId, organizationId);
    if (!task) throw AppError.notFound('Task not found');

    const { status, location, notes, completionNotes, payment, photoUrl, signature } = payload;
    const now = new Date();

    const validPrismaTaskStatuses = [
      'PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'NAVIGATING',
      'ARRIVED', 'CHECKED_IN', 'DELIVERY_IN_PROGRESS', 'PAYMENT_COLLECTED',
      'PHOTO_UPLOADED', 'VISIT_NOTES_COMPLETED', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED'
    ];

    let dbStatus = status;
    if (!validPrismaTaskStatuses.includes(status)) {
      if (status === 'STOCK_PICKED_UP') dbStatus = 'DELIVERY_IN_PROGRESS';
      else if (status === 'WAITING_FOR_WAREHOUSE_PICKUP') dbStatus = 'PENDING';
      else dbStatus = task.status; // Keep existing valid DB status (e.g. CHECKED_IN or PHOTO_UPLOADED)
    }

    const updateFields = { status: dbStatus };

    // Geo-fence validation for ARRIVED and CHECKED_IN
    if (status === 'ARRIVED' || status === 'CHECKED_IN') {
      const metadata = task.metadata || {};
      const targetCustomer = metadata.customer || {};
      const targetLocation = metadata.location || {};
      const targetLat = targetCustomer.lat ?? targetLocation.lat;
      const targetLng = targetCustomer.lng ?? targetLocation.lng;

      if (targetLat != null && targetLng != null && location?.lat != null && location?.lng != null) {
        const distance = calculateHaversineDistance(location.lat, location.lng, Number(targetLat), Number(targetLng));
        if (config.GEO_FENCE_ENABLED && distance > 100) {
          throw AppError.badRequest(`Geo-fence check failed: You are ${distance}m away from customer location. Arrive/Check-In requires being within 100m radius.`);
        }
      }
    }

    // Set specific timestamp and field updates according to status transition
    if (status === 'ACCEPTED') updateFields.acceptedAt = now;
    if (status === 'IN_PROGRESS') updateFields.startedAt = now;
    if (status === 'NAVIGATING') updateFields.navigatingAt = now;
    if (status === 'ARRIVED') updateFields.arrivedAt = now;
    if (status === 'CHECKED_IN') {
      updateFields.checkedInAt = now;
      if (location) updateFields.checkInLocation = location;
    }
    if (status === 'DELIVERY_IN_PROGRESS') updateFields.deliveryStartedAt = now;
    if (status === 'PAYMENT_COLLECTED') {
      updateFields.paymentCollectedAt = now;
      if (payment) {
        updateFields.paymentAmount = payment.amount;
        updateFields.paymentMethod = payment.method || 'CASH';
        updateFields.paymentStatus = payment.status || 'COLLECTED';
      }
    }
    if (status === 'PHOTO_UPLOADED') {
      updateFields.photoUploadedAt = now;
      if (photoUrl) {
        // Always store as JSON array so frontend can render multiple photos later
        const existingPhotos = Array.isArray(task.photos) ? task.photos : (task.photos ? [task.photos] : []);
        if (!existingPhotos.includes(photoUrl)) existingPhotos.push(photoUrl);
        updateFields.photos = existingPhotos;
      }
      // Also capture visit notes if provided alongside photo upload
      if (notes) {
        updateFields.visitNotes = notes;
        updateFields.visitNotesCompletedAt = now;
      }
    }
    if (status === 'VISIT_NOTES_COMPLETED') {
      updateFields.visitNotesCompletedAt = now;
      if (notes) updateFields.visitNotes = notes;
    }
    if (status === 'SIGNATURE_CAPTURED' || signature) {
      updateFields.signatureCapturedAt = now;
      if (signature) updateFields.customerSignature = signature;
    }
    if (status === 'INVOICE_GENERATED') {
      const currentMetadata = typeof task.metadata === 'object' && task.metadata !== null ? task.metadata : {};
      updateFields.metadata = { ...currentMetadata, invoiceGeneratedAt: now.toISOString() };
    }
    if (status === 'CHECKED_OUT') {
      updateFields.checkedOutAt = now;
      if (location) updateFields.checkOutLocation = location;
      if (signature) {
        updateFields.signatureCapturedAt = now;
        updateFields.customerSignature = signature;
      }
    }
    if (status === 'COMPLETED') {
      updateFields.completedAt = now;
      if (completionNotes || notes) updateFields.completionNotes = completionNotes || notes;

      // Automatically update linked Sales Order status to COMPLETED
      const metadata = typeof task.metadata === 'object' && task.metadata !== null ? task.metadata : {};
      const linkedOrderId = (task.referenceType === 'ORDER' ? task.referenceId : null) || metadata.orderId || metadata.order?.id;
      if (linkedOrderId) {
        try {
          const { prisma } = await import('../../config/database.js');
          await prisma.order.update({
            where: { id: linkedOrderId },
            data: {
              status: 'COMPLETED',
              updatedAt: now,
            }
          });
          const cacheService = (await import('../../shared/cache/cache.service.js')).default;
          cacheService.invalidatePrefixes([
            `${organizationId}:sales:`,
            `${organizationId}:dashboard:`,
            `${organizationId}:customers:`,
          ]);
        } catch (err) {
          console.warn('Warning: Failed to update linked sales order status to COMPLETED:', err.message);
        }
      }
    }

    const historyEntry = {
      status,
      timestamp: now.toISOString(),
      userId,
      location: location || null,
      notes: notes || completionNotes || null,
    };

    const gpsLogEntry = location ? {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || null,
      timestamp: now.toISOString(),
      status,
    } : null;

    const updatedTask = await this.repo.updateTaskExecutionState(taskId, organizationId, updateFields, historyEntry, gpsLogEntry);

    try {
      const { notificationsService } = await import('../notifications/notifications.routes.js');
      const managerId = task.assignedById;
      if (managerId && managerId !== userId) {
        let statusTitle = `Mission Update: ${task.title}`;
        let statusMsg = `Executive updated task status to ${status.replace(/_/g, ' ')}.`;
        if (status === 'ACCEPTED') statusMsg = `Executive accepted mission: "${task.title}".`;
        if (status === 'IN_PROGRESS') statusMsg = `Executive started mission: "${task.title}".`;
        if (status === 'NAVIGATING') statusMsg = `Executive started navigation for: "${task.title}".`;
        if (status === 'ARRIVED') statusMsg = `Executive arrived at destination for: "${task.title}".`;
        if (status === 'CHECKED_IN') statusMsg = `Executive checked-in for: "${task.title}".`;
        if (status === 'PHOTO_UPLOADED') statusMsg = `Executive uploaded photo evidence for: "${task.title}".`;
        if (status === 'VISIT_NOTES_COMPLETED') statusMsg = `Executive submitted visit notes for: "${task.title}".`;
        if (status === 'PAYMENT_COLLECTED') statusMsg = `Executive collected payment (₹${payment?.amount || ''}) for: "${task.title}".`;
        if (status === 'CHECKED_OUT') statusMsg = `Executive checked-out for: "${task.title}".`;
        if (status === 'COMPLETED') statusMsg = `Mission completed successfully: "${task.title}". 🎉`;

        await notificationsService.sendNotification(organizationId, managerId, {
          title: statusTitle,
          message: statusMsg,
          type: 'IN_APP',
          referenceType: 'TASK',
          referenceId: task.id,
        });
      }
    } catch (e) {
      console.warn('Failed to send task status notification:', e);
    }

    return updatedTask;
  }

  async getTaskRoute(taskId, organizationId, userLocation) {
    const task = await this.repo.getTask(taskId, organizationId);
    if (!task) throw AppError.notFound('Task not found');

    const metadata = task.metadata || {};
    const customer = metadata.customer || {};
    const location = metadata.location || {};
    const destination = metadata.destination || {};

    let destLat = task.destinationLatitude ?? customer.lat ?? location.lat ?? destination.lat ?? metadata.latitude;
    let destLng = task.destinationLongitude ?? customer.lng ?? location.lng ?? destination.lng ?? metadata.longitude;
    let address = task.destinationAddress || customer.address || location.address || destination.address || metadata.address || customer.name || 'Customer Location';

    // If coordinates are missing on legacy tasks, perform real-time geocoding fallback if address exists
    if ((destLat == null || destLng == null) && address && address !== 'Customer Location') {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'SFA-FieldForceApp/1.0' }
        });
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          destLat = parseFloat(geoData[0].lat);
          destLng = parseFloat(geoData[0].lon);
        }
      } catch (e) {
        console.warn('Backend geocoding fallback failed:', e);
      }
    }

    if (destLat == null) destLat = 22.7196;
    if (destLng == null) destLng = 75.8577;

    let originLat = userLocation?.lat ?? task.pickupLatitude;
    let originLng = userLocation?.lng ?? task.pickupLongitude;
    let pickupAddress = task.pickupAddress || 'Pickup Location';

    if ((originLat == null || originLng == null) && pickupAddress && pickupAddress !== 'Pickup Location') {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddress)}&limit=1`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'SFA-FieldForceApp/1.0' }
        });
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          originLat = parseFloat(geoData[0].lat);
          originLng = parseFloat(geoData[0].lon);
        }
      } catch (e) {
        console.warn('Backend pickup geocoding fallback failed:', e);
      }
    }

    if (originLat == null || originLng == null) {
      originLat = destLat - 0.008;
      originLng = destLng - 0.008;
    }

    let pickupLat = task.pickupLatitude;
    let pickupLng = task.pickupLongitude;

    let distanceMeters = 0;
    if (userLocation?.lat && userLocation?.lng && pickupLat != null && pickupLng != null) {
      const execToPickup = calculateHaversineDistance(userLocation.lat, userLocation.lng, pickupLat, pickupLng);
      const pickupToDest = calculateHaversineDistance(pickupLat, pickupLng, destLat, destLng);
      distanceMeters = Math.round(execToPickup + pickupToDest);
    } else {
      distanceMeters = calculateHaversineDistance(originLat, originLng, destLat, destLng);
    }
    const estimatedMinutes = Math.max(1, Math.round((distanceMeters / 1000) * 3));

    return {
      taskId,
      origin: { lat: originLat, lng: originLng },
      pickup: { lat: pickupLat ?? originLat, lng: pickupLng ?? originLng, address: pickupAddress },
      destination: { lat: destLat, lng: destLng, address },
      distanceMeters,
      distanceKm: (distanceMeters / 1000).toFixed(2),
      estimatedMinutes,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`,
    };
  }

  async getAssignedTasks(organizationId, managerId) {
    return await this.repo.getAssignedTasks(organizationId, managerId);
  }

  async getBeatPlan(beatPlanId, organizationId) {
    const plan = await this.repo.getBeatPlan(beatPlanId, organizationId);
    if (!plan) throw AppError.notFound('Beat Plan not found');
    return plan;
  }

  async listBeatPlans(organizationId, filters = {}) {
    return this.repo.listBeatPlans(organizationId, filters);
  }

  async getCalendarEvent(eventId, organizationId) {
    const event = await this.repo.getCalendarEvent(eventId, organizationId);
    if (!event) throw AppError.notFound('Calendar Event not found');
    return event;
  }

  async listCalendarEvents(organizationId, filters = {}) {
    return this.repo.listCalendarEvents(organizationId, filters);
  }

  async getAttendanceSummary(organizationId, userId, startDate, endDate) {
    return this.repo.getAttendanceSummary(organizationId, userId, startDate, endDate);
  }

  async getVisitsSummary(organizationId, userId, startDate, endDate) {
    return this.repo.getVisitsSummary(organizationId, userId, startDate, endDate);
  }

  async getExpenseSummary(organizationId, userId, startDate, endDate) {
    return this.repo.getExpenseSummary(organizationId, userId, startDate, endDate);
  }
}