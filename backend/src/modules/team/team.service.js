import { AppError } from '../../shared/response.js';
import { logAudit } from '../../utils/audit.js';
import cacheService from '../../shared/cache/cache.service.js';

/**
 * Team Service
 * Business rules for Team management
 */
export class TeamService {
  constructor(teamRepository) {
    this.repo = teamRepository;
  }

  _buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  _buildListOptions({ page, limit, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const allowedSortFields = ['name', 'createdAt', 'updatedAt'];
    const resolvedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    return { skip, take: limit, search, sortBy: resolvedSortBy, sortOrder };
  }

  async listTeams(organizationId, query, user = null) {
    const cacheKey = `org:teams:${organizationId}:${user?.id || 'all'}:${JSON.stringify(query || {})}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const options = this._buildListOptions(query);

    let branchId = query.branchId;

    if (user) {
      const isSalesManager = user.roles?.some(r => {
        const rName = typeof r === 'string' ? r : r.role?.name || r.name;
        return rName && (rName.toLowerCase().includes('manager') || rName.toLowerCase().includes('sales manager'));
      });

      if (isSalesManager && user.branchId) {
        branchId = user.branchId;
      }
    }

    const { teams, total } = await this.repo.findTeams(organizationId, {
      ...options,
      branchId,
      departmentId: query.departmentId,
      territoryId: query.territoryId,
    });
    const result = { teams, meta: this._buildPaginationMeta(total, query.page, query.limit) };
    cacheService.set(cacheKey, result, 300);
    return result;
  }

  async getTeam(id, organizationId, user = null) {
    let branchId = null;
    if (user) {
      const isSalesManager = user.roles?.some(r => {
        const rName = typeof r === 'string' ? r : r.role?.name || r.name;
        return rName && (rName.toLowerCase().includes('manager') || rName.toLowerCase().includes('sales manager'));
      });

      if (isSalesManager && user.branchId) {
        branchId = user.branchId;
      }
    }

    const team = await this.repo.findTeamById(id, organizationId, branchId);
    if (!team) throw AppError.notFound('Team not found.');
    return team;
  }

  async createTeam(organizationId, data, req) {
    const branchExists = await this.repo.branchBelongsToOrg(data.branchId, organizationId);
    if (!branchExists) throw AppError.badRequest('Branch not found within your organization.');

    if (data.departmentId) {
      const departmentExists = await this.repo.departmentBelongsToOrg(data.departmentId, organizationId);
      if (!departmentExists) throw AppError.badRequest('Department not found within your organization.');
    }

    if (data.territoryId) {
      const territoryExists = await this.repo.territoryBelongsToOrg(data.territoryId, organizationId);
      if (!territoryExists) throw AppError.badRequest('Territory not found within your organization.');
    }

    const team = await this.repo.createTeam({ ...data, organizationId });

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'team.create',
      moduleName: 'team',
      details: { teamId: team.id, name: team.name },
      req,
    });

    cacheService.invalidatePrefix("org:teams:");
    return team;
  }

  async updateTeam(id, organizationId, data, req) {
    const team = await this.repo.findTeamById(id, organizationId);
    if (!team) throw AppError.notFound('Team not found.');

    if (data.branchId) {
      const branchExists = await this.repo.branchBelongsToOrg(data.branchId, organizationId);
      if (!branchExists) throw AppError.badRequest('Branch not found within your organization.');
    }

    if (data.departmentId) {
      const departmentExists = await this.repo.departmentBelongsToOrg(data.departmentId, organizationId);
      if (!departmentExists) throw AppError.badRequest('Department not found within your organization.');
    }

    if (data.territoryId) {
      const territoryExists = await this.repo.territoryBelongsToOrg(data.territoryId, organizationId);
      if (!territoryExists) throw AppError.badRequest('Territory not found within your organization.');
    }

    const updated = await this.repo.updateTeam(id, data);

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'team.update',
      moduleName: 'team',
      details: { teamId: id, changes: data },
      req,
    });

    cacheService.invalidatePrefix("org:teams:");
    return updated;
  }

  async deleteTeam(id, organizationId, req) {
    const team = await this.repo.findTeamById(id, organizationId);
    if (!team) throw AppError.notFound('Team not found.');

    if (team._count.users > 0) {
      throw AppError.conflict('Cannot delete team while users are assigned.');
    }

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'team.delete.rejected',
      moduleName: 'team',
      details: { teamId: id, reason: 'Soft delete fields unavailable in Prisma schema.' },
      req,
    });

    throw AppError.conflict('Team cannot be deleted because the current Prisma schema does not provide soft-delete fields for this resource.');
  }

  async restoreTeam(id, organizationId, req) {
    const team = await this.repo.findTeamById(id, organizationId);
    if (!team) throw AppError.notFound('Team not found.');

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'team.restore.rejected',
      moduleName: 'team',
      details: { teamId: id, reason: 'Soft delete fields unavailable in Prisma schema.' },
      req,
    });

    throw AppError.conflict('Team restore is unavailable because the current Prisma schema does not provide soft-delete fields.');
  }

  // --- Assignment & Hierarchy Methods ---

  async resolveUserByRole(organizationId, roleId) {
    return this.repo.findFirstUserByRole(organizationId, roleId);
  }

  async resolveRoundRobin(organizationId, roleId, payload) {
    const users = await this.repo.findUsersByRole(organizationId, roleId);
    if (!users || users.length === 0) return null;

    const seed = payload.entityId || payload.leadId || payload.orderId || String(Date.now());
    const index = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % users.length;
    return users[index].user.id;
  }

  async resolveByTerritory(organizationId, territoryId) {
    return this.repo.findFirstUserByTerritory(organizationId, territoryId);
  }

  async resolveManager(userId) {
    return this.repo.findManagerByUserId(userId);
  }

  async resolveLeastWorkload(organizationId, roleId) {
    const userRoles = await this.repo.findUsersByRole(organizationId, roleId);
    if (!userRoles || userRoles.length === 0) return null;

    const userIds = userRoles.map(ur => ur.user.id);
    const counts = await this.repo.findUserCountsForWorkload(organizationId, userIds);
    
    const countMap = Object.fromEntries(counts.map(c => [c.assignedToId, c._count.assignedToId]));
    const sorted = userIds.sort((a, b) => (countMap[a] || 0) - (countMap[b] || 0));
    return sorted[0];
  }
}
