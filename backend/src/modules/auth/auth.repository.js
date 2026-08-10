import { prisma } from "../../config/database.js";

/**
 * Authentication Module Database Repository
 */
export class AuthRepository {
  /**
   * Find organization by slug
   * @param {string} slug - unique slug
   */
  async findOrganizationBySlug(slug) {
    return prisma.organization.findUnique({
      where: { slug },
    });
  }

  /**
   * Find user by email with full role/permission graph
   * @param {string} email - lowercased email
   */
  async findAuthByEmail(email) {

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      deletedAt: true,
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      branch: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });


  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    passwordHash: user.passwordHash,
    failedLoginAttempts: user.failedLoginAttempts,
    lockoutExpiresAt: user.lockoutExpiresAt,
    emailVerifiedAt: user.emailVerifiedAt,
    emailVerificationOtp: user.emailVerificationOtp,
    emailVerificationExpiresAt: user.emailVerificationExpiresAt,
    passwordResetOtp: user.passwordResetOtp,
    passwordResetExpiresAt: user.passwordResetExpiresAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    user,
  };
}

  /**
   * Find user by ID with full role/permission graph
   * @param {string} userId - UUID
   */
  async findUserById(userId) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find auth credential by User ID
   * @param {string} userId - UUID
   */
  async findAuthByUserId(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    return {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      passwordHash: user.passwordHash,
      failedLoginAttempts: user.failedLoginAttempts,
      lockoutExpiresAt: user.lockoutExpiresAt,
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerificationOtp: user.emailVerificationOtp,
      emailVerificationExpiresAt: user.emailVerificationExpiresAt,
      passwordResetOtp: user.passwordResetOtp,
      passwordResetExpiresAt: user.passwordResetExpiresAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      user: user,
    };
  }

  /**
   * Update User Auth attributes
   * @param {string} userId - UUID
   * @param {Object} data - Update payload
   */
  async updateUserAuth(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Create Session
   * @param {Object} data - Session model fields
   */
  async createSession(data) {
    return prisma.session.create({
      data,
    });
  }

  /**
   * Find session by token value
   * @param {string} token - unique token hash
   */
  async findSessionByToken(token) {
    return prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  }

  /**
   * Delete specific session
   * @param {string} sessionId - UUID
   */
  async deleteSession(sessionId) {
    return prisma.session.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Find session details by ID
   * @param {string} id - UUID
   */
  async findSessionById(id) {
    return prisma.session.findUnique({
      where: { id },
    });
  }

  /**
   * Terminate all active sessions for a user
   * @param {string} userId - UUID
   */
  async deleteSessionsByUserId(userId) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Find Session by Refresh Token
   * @param {string} refreshToken - refresh token value
   */
  async findSessionByRefreshToken(refreshToken) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: true,
      },
    });
  }

  /**
   * Update Session attributes
   * @param {string} id - UUID
   * @param {Object} data - payload
   */
  async updateSession(id, data) {
    return prisma.session.update({
      where: { id },
      data,
    });
  }

  /**
   * Retrieve password history list
   * @param {string} userId - UUID
   * @param {number} limit - max size
   */
  async getPasswordHistory(userId, limit = 5) {
    return prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Add password hash to history
   * @param {string} userId - UUID
   * @param {string} passwordHash - encrypted password
   */
  async createPasswordHistory(userId, passwordHash) {
    return prisma.passwordHistory.create({
      data: {
        userId,
        passwordHash,
      },
    });
  }

  /**
   * Create system audit log
   * @param {Object} data - log values
   */
  async createAuditLog(data) {
    return prisma.auditLog.create({
      data,
    });
  }



  /**
   * Fetch all active sessions for a user
   * @param {string} userId - UUID
   */
  async findActiveSessions(userId) {
    return prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Count active sessions for a user
   * @param {string} userId - UUID
   */
  async findActiveSessionsCount(userId) {
    return prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Delete the oldest active session for a user (limit enforcement)
   * @param {string} userId - UUID
   */
  async deleteOldestSession(userId) {
    const oldestSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (oldestSession) {
      return prisma.session.delete({
        where: { id: oldestSession.id },
      });
    }
    return null;
  }

  /**
   * Get audit logs for a tenant organization
   * @param {string} organizationId - UUID
   * @param {number} limit - page limit
   * @param {number} offset - page offset
   */
  async getAuditLogs(organizationId, limit = 50, offset = 0) {
    return prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Update user profile fields
   * @param {string} userId - UUID
   * @param {Object} data - { firstName, lastName, phoneNumber }
   */
  async updateUserProfile(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}

export default AuthRepository;
