import { prisma } from '../../config/database.js';

export class FieldForceRepository {
  async checkIn(organizationId, userId, data) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        checkInAt: new Date(),
        checkInLoc: data.location,
        status: 'PRESENT',
      },
      create: {
        organizationId,
        userId,
        date: today,
        checkInAt: new Date(),
        checkInLoc: data.location,
        status: 'PRESENT',
      },
    });
  }

  async checkOut(organizationId, userId, data) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return prisma.attendance.update({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      data: {
        checkOutAt: new Date(),
        checkOutLoc: data.location,
      },
    });
  }

  async createVisit(organizationId, userId, data) {
    return prisma.visit.create({
      data: {
        organizationId,
        userId,
        title: data.title,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        location: data.location,
        notes: data.notes,
        customerId: data.customerId,
      },
    });
  }

  async updateVisitStatus(visitId, organizationId, status, data = {}) {
    const updateData = {};
    if (status) updateData.status = status;
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    if (data.notes) updateData.notes = data.notes;
    if (data.photoUrl) updateData.photoUrl = data.photoUrl;

    return prisma.visit.update({
      where: { id: visitId, organizationId },
      data: updateData,
    });
  }

  async createExpense(organizationId, userId, data) {
    return prisma.expense.create({
      data: {
        organizationId,
        userId,
        amount: Number(data.amount) || 0,
        status: data.status || 'PENDING',
      },
    });
  }

  async createDar(organizationId, userId, data) {
    return prisma.dailyActivityReport.create({
      data: {
        organizationId,
        userId,
        content: typeof data.summary === 'string' ? data.summary : (data.content || JSON.stringify(data)),
      },
    });
  }

  async createTask(organizationId, assignedById, data) {
    return prisma.task.create({
      data: {
        organizationId,
        assignedById,
        assignedToId: data.assignedToId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        pickupAddress: data.pickupAddress || null,
        pickupLatitude: data.pickupLatitude ? parseFloat(data.pickupLatitude) : null,
        pickupLongitude: data.pickupLongitude ? parseFloat(data.pickupLongitude) : null,
        destinationAddress: data.destinationAddress || null,
        destinationLatitude: data.destinationLatitude ? parseFloat(data.destinationLatitude) : null,
        destinationLongitude: data.destinationLongitude ? parseFloat(data.destinationLongitude) : null,
        metadata: data.metadata || undefined,
      },
      include: {
        assignedBy: true,
        assignedTo: true,
      },
    });
  }

  async createBeatPlan(organizationId, userId, data) {
    return prisma.beatPlan.create({
      data: {
        organizationId,
        userId,
        title: data.title,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'DRAFT',
      },
    });
  }

  async updateBeatPlanStatus(beatPlanId, organizationId, status) {
    return prisma.beatPlan.update({
      where: { id: beatPlanId, organizationId },
      data: { status },
    });
  }

  async createCalendarEvent(organizationId, userId, data) {
    return prisma.calendarEvent.create({
      data: {
        organizationId,
        userId,
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        type: data.type,
      },
    });
  }

  // ===== GET/LIST METHODS =====

  async getAttendance(organizationId, userId, date) {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    return prisma.attendance.findFirst({
      where: {
        organizationId,
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async listAttendance(organizationId, filters = {}) {
    const { userId, startDate, endDate, skip = 0, take = 20 } = filters;

    const where = { organizationId };
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: Number(skip) || 0,
        take: Number(take) || 20,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);

    return { attendance, total };
  }

  async getVisit(visitId, organizationId) {
    return prisma.visit.findFirst({
      where: { id: visitId, organizationId },
      include: { user: true },
    });
  }

  async listVisits(organizationId, filters = {}) {
    const { userId, status, customerId, branchId, skip = 0, take = 20 } = filters;

    const where = { organizationId };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (branchId) {
      where.user = { branchId };
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip: Number(skip) || 0,
        take: Number(take) || 20,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.visit.count({ where }),
    ]);

    return { visits, total };
  }

  async getExpense(expenseId, organizationId) {
    return prisma.expense.findFirst({
      where: { id: expenseId, organizationId },
      include: { user: true, approver: true },
    });
  }

  async listExpenses(organizationId, filters = {}) {
    const { userId, status, startDate, endDate, skip = 0, take = 20 } = filters;

    const where = { organizationId };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: Number(skip) || 0,
        take: Number(take) || 20,
        include: { user: true, approver: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  async updateExpenseStatus(expenseId, organizationId, status, approvedById = null) {
    const updateData = { status };
    if (approvedById) {
      updateData.approver = { connect: { id: approvedById } };
    }

    return prisma.expense.update({
      where: { id: expenseId, organizationId },
      data: updateData,
      include: { user: true, approver: true },
    });
  }

  async getDailyActivityReport(darId, organizationId) {
    return prisma.dailyActivityReport.findFirst({
      where: { id: darId, organizationId },
      include: { user: true },
    });
  }

  async listDailyActivityReports(organizationId, filters = {}) {
    const { userId, startDate, endDate, skip = 0, take = 20 } = filters;

    const where = { organizationId };
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [dars, total] = await Promise.all([
      prisma.dailyActivityReport.findMany({
        where,
        skip: Number(skip) || 0,
        take: Number(take) || 20,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dailyActivityReport.count({ where }),
    ]);

    return { dars, total };
  }

  async updateDarStatus(darId, organizationId, status) {
    return prisma.dailyActivityReport.findFirst({
      where: { id: darId, organizationId },
      include: { user: true },
    });
  }

  async upsertDailyActivityReport(organizationId, userId, date, data) {
    const existing = await prisma.dailyActivityReport.findFirst({
      where: {
        organizationId,
        userId,
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(date).setHours(23, 59, 59, 999))
        }
      }
    });

    if (existing) {
      return prisma.dailyActivityReport.update({
        where: { id: existing.id },
        data,
        include: { user: true }
      });
    }

    return prisma.dailyActivityReport.create({
      data: {
        organizationId,
        userId,
        date: new Date(date),
        ...data
      },
      include: { user: true }
    });
  }

  async getTask(taskId, organizationId) {
    return prisma.task.findFirst({
      where: { id: taskId, organizationId },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true }
        },
        assignedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
    });
  }

  async listTasks(organizationId, filters = {}) {
    const { assignedToId, assignedById, status, branchId, skip = 0, take = 20 } = filters;

    const where = { organizationId };
    if (assignedToId) where.assignedToId = assignedToId;
    if (assignedById) {
      where.OR = [
        { assignedById: assignedById },
        { assignedTo: { managerId: assignedById } },
        ...(branchId ? [{ assignedTo: { branchId: branchId } }] : [])
      ];
    }
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: Number(skip) || 0,
        take: Number(take) || 20,
        include: { assignedTo: true, assignedBy: true },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async getAssignedTasks(organizationId, managerId) {
    return prisma.task.findMany({
      where: {
        organizationId,
        assignedById: managerId,
      },
      include: {
        assignedTo: true,
      },
    });
  }

  async completeTask(taskId, organizationId, data = {}) {
    return prisma.task.update({
      where: { id: taskId, organizationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: data.completionNotes
      },
      include: { assignedTo: true, assignedBy: true },
    });
  }

  async updateTaskExecutionState(taskId, organizationId, updateFields, historyEntry, gpsLogEntry) {
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { executionHistory: true, gpsLogs: true, photos: true }
    });

    const currentHistory = Array.isArray(existingTask?.executionHistory) ? existingTask.executionHistory : [];
    const currentGpsLogs = Array.isArray(existingTask?.gpsLogs) ? existingTask.gpsLogs : [];
    const currentPhotos = Array.isArray(existingTask?.photos) ? existingTask.photos : [];

    const newHistory = historyEntry ? [...currentHistory, historyEntry] : currentHistory;
    const newGpsLogs = gpsLogEntry ? [...currentGpsLogs, gpsLogEntry] : currentGpsLogs;

    let newPhotos = currentPhotos;
    if (updateFields.photos) {
      if (Array.isArray(updateFields.photos)) {
        newPhotos = [...currentPhotos, ...updateFields.photos];
      } else {
        newPhotos = [...currentPhotos, updateFields.photos];
      }
    }

    const dataToUpdate = {
      ...updateFields,
      executionHistory: newHistory,
      gpsLogs: newGpsLogs,
    };
    if (updateFields.photos) {
      dataToUpdate.photos = newPhotos;
    }

    return prisma.task.update({
      where: { id: taskId, organizationId },
      data: dataToUpdate,
      include: { assignedTo: true, assignedBy: true },
    });
  }

  async getBeatPlan(beatPlanId, organizationId) {
    return prisma.beatPlan.findFirst({
      where: { id: beatPlanId, organizationId },
      include: { user: true },
    });
  }

  async listBeatPlans(organizationId, filters = {}) {
    const { userId, status, skip = 0, take = 20 } = filters;

    const where = { organizationId };
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [plans, total] = await Promise.all([
      prisma.beatPlan.findMany({
        where,
        skip: Number(skip) || 0,
        take: Number(take) || 20,
        include: { user: true },
        orderBy: { startDate: 'desc' },
      }),
      prisma.beatPlan.count({ where }),
    ]);

    return { plans, total };
  }

  async getCalendarEvent(eventId, organizationId) {
    return prisma.calendarEvent.findFirst({
      where: { id: eventId, organizationId },
      include: { user: true },
    });
  }

  async listCalendarEvents(organizationId, filters = {}) {
    const { userId, startDate, endDate, skip = 0, take = 20 } = filters;

    const where = { organizationId };
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        skip: Number(skip) || 0,
        take: Number(take) || 20,
        include: { user: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    return { events, total };
  }

  // Analytics & Aggregations
  async getAttendanceSummary(organizationId, userId, startDate, endDate) {
    const where = { organizationId };
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.attendance.findMany({ where });

    const summary = {
      totalDays: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      leave: records.filter(r => r.status === 'LEAVE').length,
      halfday: records.filter(r => r.status === 'HALFDAY').length,
    };

    return summary;
  }

  async getVisitsSummary(organizationId, userId, startDate, endDate) {
    const where = { organizationId };
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const visits = await prisma.visit.findMany({ where });

    const summary = {
      total: visits.length,
      planned: visits.filter(v => v.status === 'PLANNED').length,
      inProgress: visits.filter(v => v.status === 'IN_PROGRESS').length,
      completed: visits.filter(v => v.status === 'COMPLETED').length,
      cancelled: visits.filter(v => v.status === 'CANCELLED').length,
    };

    return summary;
  }

  async getVisitSummary(organizationId, userId, startDate, endDate) {
    return this.getVisitsSummary(organizationId, userId, startDate, endDate);
  }

  async getExpenseSummary(organizationId, userId, startDate, endDate) {
    const where = { organizationId };
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const expenses = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalAmount: expenses._sum.amount || 0,
      totalCount: expenses._count || 0,
    };
  }
}