import { AppError } from '../../../shared/response.js';
import { logAudit } from '../../../utils/audit.js';
import cacheService from '../../../shared/cache/cache.service.js';

/** Business rules for tenant roles. */
export class RoleService {
  constructor(roleRepository) { this.repo = roleRepository; }

  _invalidate(orgId) {
    if (!orgId) return;
    cacheService.invalidatePrefixes([
      `${orgId}:roles:`,
      `${orgId}:auth:`,
      `${orgId}:users:`,
    ]);
  }

  _options({ page, limit, search, sortBy, sortOrder }) {
    const allowed = ['name', 'createdAt', 'updatedAt', 'level'];
    return { skip: (page - 1) * limit, take: limit, search, sortBy: allowed.includes(sortBy) ? sortBy : 'createdAt', sortOrder };
  }

  _meta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }

  async listRoles(organizationId, query) {
    const cacheKey = cacheService.buildKey({
      orgId: organizationId,
      module: 'roles',
      resource: 'list',
      params: query,
    });

    return cacheService.getOrSet(cacheKey, async () => {
      const { roles, total } = await this.repo.findAll(organizationId, this._options(query));
      return { roles, meta: this._meta(total, query.page, query.limit) };
    }, 600); // 10 minutes TTL
  }

  async getRole(id, organizationId) {
    const cacheKey = cacheService.buildKey({
      orgId: organizationId,
      module: 'roles',
      resource: 'detail',
      scopeId: id,
    });

    return cacheService.getOrSet(cacheKey, async () => {
      const role = await this.repo.findById(id, organizationId);
      if (!role) throw AppError.notFound('Role not found.');
      return role;
    }, 600); // 10 minutes TTL
  }

  async createRole(organizationId, data, req) {
    if (await this.repo.existsByName(data.name, organizationId)) throw AppError.badRequest(`Role '${data.name}' already exists.`);
    const role = await this.repo.create({ organizationId, name: data.name, description: data.description, isSystem: false });
    await logAudit({ organizationId, userId: req.user.id, action: 'role.create', moduleName: 'roles', details: { roleId: role.id, name: role.name }, req });
    this._invalidate(organizationId);
    return role;
  }

  async updateRole(id, organizationId, data, req) {
    const role = await this.getRole(id, organizationId);
    if (role.isSystem) throw AppError.forbidden('System roles cannot be modified.');
    if (data.name && data.name !== role.name && await this.repo.existsByName(data.name, organizationId, id)) throw AppError.badRequest(`Role '${data.name}' already exists.`);
    const updated = await this.repo.update(id, { ...(data.name !== undefined && { name: data.name }), ...(data.description !== undefined && { description: data.description }) });
    await logAudit({ organizationId, userId: req.user.id, action: 'role.update', moduleName: 'roles', details: { roleId: id, changes: data }, req });
    this._invalidate(organizationId);
    return updated;
  }

  async deleteRole(id, organizationId, req) {
    const role = await this.getRole(id, organizationId);
    if (role.isSystem) throw AppError.forbidden('System roles cannot be deleted.');
    if (role._count.users > 0) throw AppError.conflict('Cannot delete a role assigned to users.');
    await this.repo.delete(id);
    await logAudit({ organizationId, userId: req.user.id, action: 'role.delete', moduleName: 'roles', details: { roleId: id, name: role.name }, req });
    this._invalidate(organizationId);
  }

  async getStatistics(organizationId) { return this.repo.getStatistics(organizationId); }
}
