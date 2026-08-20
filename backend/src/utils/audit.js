import { prisma } from '../config/database.js';
import logger from './logger.js';

/**
 * Helper to record system audit logs
 * @param {Object} params
 * @param {string} params.organizationId - UUID of organization
 * @param {string|null} params.userId - UUID of user who triggered the action (null for system)
 * @param {string} params.action - e.g., "user.create", "company.update"
 * @param {string} params.moduleName - e.g., "users", "organization"
 * @param {Object|null} params.details - payload or change details
 * @param {Object|null} params.req - Express request context for IP and User Agent
 */
export const logAudit = async ({
  organizationId,
  userId,
  action,
  moduleName,
  details = null,
  req = null
}) => {
  try {
    const ipAddress = req ? (req.ip || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    const userAgent = req ? (req.headers?.['user-agent'] || null) : null;

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        moduleName,
        details: details || {},
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};
