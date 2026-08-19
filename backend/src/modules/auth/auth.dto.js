/**
 * Data Transfer Objects (DTO) for Authentication Module
 */

export class AuthUserDto {
  /**
   * Map User Database entity to User Response DTO
   * @param {Object} user - Prisma User object
   */
  constructor(user) {
    this.id = user.id;
    this.organizationId = user.organizationId;
    this.branchId = user.branchId || null;
    this.departmentId = user.departmentId || null;
    this.teamId = user.teamId || null;
    this.territoryId = user.territoryId || null;
    
    this.organization = user.organization
      ? { id: user.organization.id, name: user.organization.name, slug: user.organization.slug }
      : null;
    this.branch = user.branch
      ? { id: user.branch.id, name: user.branch.name, code: user.branch.code }
      : null;
    this.department = user.department
      ? { id: user.department.id, name: user.department.name, code: user.department.code }
      : null;

    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = `${user.firstName} ${user.lastName}`;
    this.phoneNumber = user.phoneNumber || null;
    this.avatarUrl = user.avatarUrl || null;
    this.isActive = user.isActive;
    
    this.emailVerified = !!user.emailVerifiedAt;
    this.emailVerifiedAt = user.emailVerifiedAt || null;
    
    this.roles = user.roles ? user.roles.map((ur) => ({
      roleId: ur.role.id,
      name: ur.role.name,
      permissions: ur.role.permissions ? ur.role.permissions.map((rp) => rp.permission.slug) : [],
    })) : [];
    
    // Derived overall permission slugs array
    this.permissions = Array.from(
      new Set(
        this.roles.flatMap((role) => role.permissions)
      )
    );
    
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static toResponse(user) {
    return new AuthUserDto(user);
  }
}

export class AuthSessionDto {
  /**
   * Map Session Database entity to Session Response DTO
   * @param {Object} session - Prisma Session object
   */
  constructor(session) {
    this.id = session.id;
    this.userId = session.userId;
    this.userAgent = session.userAgent || null;
    this.ipAddress = session.ipAddress || null;
    this.expiresAt = session.expiresAt;
    this.createdAt = session.createdAt;
  }

  static toResponse(session) {
    return new AuthSessionDto(session);
  }
}

export class AuthTokensDto {
  /**
   * Format Tokens Response Payload
   * @param {string} accessToken - JWT Access Token
   * @param {string} [refreshToken] - JWT Refresh Token
   */
  constructor(accessToken, refreshToken = null) {
    this.tokenType = "Bearer";
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }

  static toResponse(accessToken, refreshToken = null) {
    return new AuthTokensDto(accessToken, refreshToken);
  }
}
