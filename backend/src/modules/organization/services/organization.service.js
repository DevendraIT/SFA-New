import { AppError } from '../../../shared/response.js';
import { logAudit } from '../../../utils/audit.js';
import { prisma } from '../../../config/database.js';
import { BranchRepository } from '../repositories/BranchRepository.js';
import { DepartmentRepository } from '../repositories/DepartmentRepository.js';
import { TerritoryRepository } from '../repositories/TerritoryRepository.js';
import { locationService } from '../../../services/location.service.js';

/**
 * Organization Service
 * Business logic for Organization, Company, Branch, Department, Territory
 */
export class OrganizationService {
  constructor(organizationRepository) {
    this.repo = organizationRepository;
    this.branchRepo = new BranchRepository();
    this.departmentRepo = new DepartmentRepository();
    this.territoryRepo = new TerritoryRepository();
  }

  // --------------------------------------------------
  // Shared
  // --------------------------------------------------

  _buildPaginationMeta(total, page = 1, limit = 20) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const totalPages = Math.ceil(total / limitNum);
    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    };
  }

  _buildListOptions({ page = 1, limit = 20, search, sortBy, sortOrder } = {}) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const allowedSortFields = ['name', 'createdAt', 'updatedAt', 'slug', 'isActive'];
    const resolvedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    return { skip, take: limitNum, search, sortBy: resolvedSortBy, sortOrder };
  }

  async _rejectSoftDelete(entityName, entityId, organizationId, req) {
    await logAudit({
      organizationId,
      userId: req.user.id,
      action: `${entityName.toLowerCase()}.delete.rejected`,
      moduleName: 'organization',
      details: { entityId, reason: 'Soft delete fields unavailable in Prisma schema.' },
      req,
    });

    throw AppError.conflict(
      `${entityName} cannot be deleted because the current Prisma schema does not provide soft-delete fields for this resource.`
    );
  }

  // --------------------------------------------------
  // Organization
  // --------------------------------------------------

  async listOrganizations(query) {
    const options = this._buildListOptions(query);
    const { organizations, total } = await this.repo.findAll({
      ...options,
      isActive: query.isActive,
    });
    return { 
      organizations, 
      meta: this._buildPaginationMeta(total, query.page, query.limit) 
    };
  }

  async getOrganization(organizationId) {
    let org = organizationId ? await this.repo.findById(organizationId) : null;
    if (!org) {
      org = (await prisma.organization.findFirst({ where: { isActive: true } })) || (await prisma.organization.findFirst());
    }
    if (!org) throw AppError.notFound('Organization not found.');
    return org;
  }

  async createOrganization(data, req) {
    // 1. Super Admin Role Enforcement
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const isSuperAdmin = userRoles.some(
      (r) => typeof r === 'string' && (r.toLowerCase().includes('super') || r.toLowerCase().includes('admin'))
    );

    if (!isSuperAdmin) {
      throw AppError.forbidden('Only Super Admin is authorized to create an organization.');
    }

    // 2. Strict Single Organization Limit (Max 1 Organization in system)
    const existingCount = await prisma.organization.count();
    if (existingCount >= 1) {
      throw AppError.badRequest(
        'System limit reached: Only a single organization can be created. An organization already exists.'
      );
    }

    if (await this.repo.existsByName(data.name)) {
      throw AppError.badRequest(`Organization name '${data.name}' is already in use.`);
    }

    const slug = this._generateSlug(data.name);
    let uniqueSlug = slug;
    let counter = 1;
    
    while (await this.repo.existsBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const organizationData = {
      ...data,
      slug: uniqueSlug,
      isActive: data.isActive ?? true,
    };

    const organization = await this.repo.create(organizationData);

    await logAudit({
      organizationId: organization.id,
      userId: req.user?.id || null,
      action: 'organization.create',
      moduleName: 'organization',
      details: { 
        organizationId: organization.id, 
        name: organization.name,
        slug: organization.slug 
      },
      req,
    });

    return organization;
  }

  _generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async updateOrganization(organizationId, data, req) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw AppError.notFound('Organization not found.');

    if (data.name && data.name !== org.name) {
      if (await this.repo.existsByName(data.name, organizationId)) {
        throw AppError.badRequest(`Organization name '${data.name}' is already in use.`);
      }
      
      const slug = this._generateSlug(data.name);
      let uniqueSlug = slug;
      let counter = 1;
      
      while (await this.repo.existsBySlug(uniqueSlug, organizationId)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      
      data.slug = uniqueSlug;
    }

    const updated = await this.repo.update(organizationId, data);

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'organization.update',
      moduleName: 'organization',
      details: { changes: data },
      req,
    });

    return updated;
  }

  async activateOrganization(organizationId, req) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw AppError.notFound('Organization not found.');
    
    if (org.isActive) {
      throw AppError.badRequest('Organization is already active.');
    }

    const updated = await this.repo.update(organizationId, { isActive: true });

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'organization.activate',
      moduleName: 'organization',
      details: { organizationId, previousStatus: false },
      req,
    });

    return updated;
  }

  async deactivateOrganization(organizationId, req) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw AppError.notFound('Organization not found.');
    
    if (!org.isActive) {
      throw AppError.badRequest('Organization is already inactive.');
    }

    // Business Rule: Cannot deactivate if active users exist
    const statistics = await this.repo.getStatistics(organizationId);
    if (statistics.users.active > 0) {
      throw AppError.conflict('Cannot deactivate organization while active users exist. Please deactivate all users first.');
    }

    const updated = await this.repo.update(organizationId, { isActive: false });

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'organization.deactivate',
      moduleName: 'organization',
      details: { organizationId, previousStatus: true },
      req,
    });

    return updated;
  }

  async deleteOrganization(organizationId, req) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw AppError.notFound('Organization not found.');

    const deleted = await this.repo.delete(organizationId);

    await logAudit({
      organizationId: null,
      userId: req.user?.id || null,
      action: 'organization.delete',
      moduleName: 'organization',
      details: { organizationId, name: org.name },
      req,
    });

    return deleted;
  }

  async getStatistics(organizationId, req) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw AppError.notFound('Organization not found.');

    const statistics = await this.repo.getStatistics(organizationId);

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'organization.statistics.view',
      moduleName: 'organization',
      details: { organizationId },
      req,
    });

    return {
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        isActive: org.isActive,
      },
      statistics,
    };
  }

  // --------------------------------------------------
  // Branch
  // --------------------------------------------------

  async listBranches(organizationId, query) {
    const options = this._buildListOptions(query);
    const { branches, total } = await this.branchRepo.findAll(organizationId, {
      ...options,
      
    });
    return { branches, meta: this._buildPaginationMeta(total, query.page, query.limit) };
  }

  async getBranch(id, organizationId) {
    const branch = await this.branchRepo.findById(id, organizationId);
    if (!branch) throw AppError.notFound('Branch not found.');
    return branch;
  }

  async createBranch(organizationId, data, req) {
    if (data.code) {
      const existing = await this.branchRepo.findByCode(organizationId, data.code);
      if (existing) throw AppError.badRequest(`Branch code '${data.code}' is already in use within this company.`);
    }

    const territory = await this.territoryRepo.findById(data.territoryId, organizationId);
    if (!territory) throw AppError.badRequest('Territory not found within your organization.');
    const department = await this.departmentRepo.findById(data.departmentId, organizationId);
    if (!department) throw AppError.badRequest('Department not found within your organization.');

    let lat = data.latitude ? parseFloat(data.latitude) : null;
    let lng = data.longitude ? parseFloat(data.longitude) : null;
    const fullAddress = [data.address, data.city, data.state, data.country].filter(Boolean).join(', ');

    if ((!lat || !lng) && fullAddress) {
      try {
        const geo = await locationService.geocodeAddress(fullAddress);
        if (geo?.latitude && geo?.longitude) {
          lat = geo.latitude;
          lng = geo.longitude;
        }
      } catch (e) {
        console.warn('Branch creation geocoding warning:', e.message);
      }
    }

    const branch = await this.branchRepo.create({
      organizationId,
      departmentId: data.departmentId,
      territoryId: data.territoryId,
      name: data.name,
      code: data.code,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      latitude: lat,
      longitude: lng,
    });

    if (req?.user?.id) {
      await logAudit({
        organizationId,
        userId: req.user.id,
        action: 'branch.create',
        moduleName: 'organization',
        details: { branchId: branch.id, name: branch.name, organizationId: data.organizationId },
        req,
      }).catch(err => console.warn('Audit log warning:', err.message));
    }

    return branch;
  }

  async updateBranch(id, organizationId, data, req) {
    const branch = await this.branchRepo.findById(id, organizationId);
    if (!branch) throw AppError.notFound('Branch not found.');

    if (data.code && data.code !== branch.code) {
      const existing = await this.branchRepo.findByCode(organizationId, data.code);
      if (existing) throw AppError.badRequest(`Branch code '${data.code}' is already in use within this company.`);
    }

    let lat = data.latitude !== undefined ? (data.latitude ? parseFloat(data.latitude) : null) : branch.latitude;
    let lng = data.longitude !== undefined ? (data.longitude ? parseFloat(data.longitude) : null) : branch.longitude;

    const newFullAddress = [
      data.address !== undefined ? data.address : branch.address,
      data.city !== undefined ? data.city : branch.city,
      data.state !== undefined ? data.state : branch.state,
      data.country !== undefined ? data.country : branch.country,
    ].filter(Boolean).join(', ');

    const oldFullAddress = [branch.address, branch.city, branch.state, branch.country].filter(Boolean).join(', ');

    const addressChanged = newFullAddress && newFullAddress !== oldFullAddress;
    const missingCoords = !lat || !lng;

    if ((addressChanged || missingCoords) && newFullAddress) {
      const geo = await locationService.geocodeAddress(newFullAddress);
      lat = geo.latitude;
      lng = geo.longitude;
    }

    const updated = await this.branchRepo.update(id, {
      ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
      ...(data.territoryId !== undefined && { territoryId: data.territoryId }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),

      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),

      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      latitude: lat,
      longitude: lng,
    });
    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'branch.update',
      moduleName: 'organization',
      details: { branchId: id, changes: data },
      req,
    });

    return updated;
  }

  async deleteBranch(id, organizationId, req) {
    const branch = await this.branchRepo.findById(id, organizationId);
    if (!branch) throw AppError.notFound('Branch not found.');

    const activeUserCount = await this.branchRepo.countActiveUsers(id);
    if (activeUserCount > 0) {
      throw AppError.conflict('Cannot delete branch while active users exist.');
    }

    const deleted = await this.branchRepo.delete(id);

    if (req?.user?.id) {
      await logAudit({
        organizationId,
        userId: req.user.id,
        action: 'branch.delete',
        moduleName: 'organization',
        details: { branchId: id, name: branch.name },
        req,
      }).catch(err => console.warn('Audit log warning:', err.message));
    }

    return deleted;
  }

  async restoreBranch(id, organizationId, req) {
    const branch = await this.branchRepo.findById(id, organizationId);
    if (!branch) throw AppError.notFound('Branch not found.');

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'branch.restore.rejected',
      moduleName: 'organization',
      details: { branchId: id, reason: 'Soft delete fields unavailable in Prisma schema.' },
      req,
    });

    throw AppError.conflict('Branch restore is unavailable because the current Prisma schema does not provide soft-delete fields.');
  }

  // --------------------------------------------------
  // Department
  // --------------------------------------------------

  async listDepartments(organizationId, query) {
    const options = this._buildListOptions(query);
    const { departments, total } = await this.departmentRepo.findAll(organizationId, {
      ...options,
      branchId: query.branchId,
    });
    return { departments, meta: this._buildPaginationMeta(total, query.page, query.limit) };
  }

  async getDepartment(id, organizationId) {
    const department = await this.departmentRepo.findById(id, organizationId);
    if (!department) throw AppError.notFound('Department not found.');
    return department;
  }

  async createDepartment(organizationId, data, req) {
    if (data.code) {
      const existing = await this.departmentRepo.findByCode(organizationId, data.code);
      if (existing) throw AppError.badRequest(`Department code '${data.code}' is already in use within this organization.`);
    }

    const department = await this.departmentRepo.create({ ...data, organizationId });
    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'department.create',
      moduleName: 'organization',
      details: { departmentId: department.id, name: department.name },
      req,
    });

    return department;
  }

  async updateDepartment(id, organizationId, data, req) {
    const department = await this.departmentRepo.findById(id, organizationId);
    if (!department) throw AppError.notFound('Department not found.');

    if (data.code && data.code !== department.code) {
      const existing = await this.departmentRepo.findByCode(organizationId, data.code);
      if (existing) throw AppError.badRequest(`Department code '${data.code}' is already in use within this organization.`);
    }

    const updated = await this.departmentRepo.update(id, data);

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'department.update',
      moduleName: 'organization',
      details: { departmentId: id, changes: data },
      req,
    });

    return updated;
  }

  async deleteDepartment(id, organizationId, req) {
    const department = await this.departmentRepo.findById(id, organizationId);
    if (!department) throw AppError.notFound('Department not found.');

    if (department._count.users > 0 || department._count.teams > 0) {
      throw AppError.conflict('Cannot delete department while users or teams are assigned.');
    }

    const deleted = await this.departmentRepo.delete(id);

    if (req?.user?.id) {
      await logAudit({
        organizationId,
        userId: req.user.id,
        action: 'department.delete',
        moduleName: 'organization',
        details: { departmentId: id, name: department.name },
        req,
      }).catch(err => console.warn('Audit log warning:', err.message));
    }

    return deleted;
  }

  async restoreDepartment(id, organizationId, req) {
    const department = await this.departmentRepo.findById(id, organizationId);
    if (!department) throw AppError.notFound('Department not found.');

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'department.restore.rejected',
      moduleName: 'organization',
      details: { departmentId: id, reason: 'Soft delete fields unavailable in Prisma schema.' },
      req,
    });

    throw AppError.conflict('Department restore is unavailable because the current Prisma schema does not provide soft-delete fields.');
  }
  // --------------------------------------------------
  // Territory
  // --------------------------------------------------

  async listTerritories(organizationId, query) {
    const options = this._buildListOptions(query);
    const { territories, total } = await this.territoryRepo.findAll(organizationId, {
      ...options,
      
    });
    return { territories, meta: this._buildPaginationMeta(total, query.page, query.limit) };
  }

  async getTerritory(id, organizationId) {
    const territory = await this.territoryRepo.findById(id, organizationId);
    if (!territory) throw AppError.notFound('Territory not found.');
    return territory;
  }

  async createTerritory(organizationId, data, req) {
    const department = await this.departmentRepo.findById(data.departmentId, organizationId);
    if (!department) throw AppError.badRequest('Department not found within your organization.');

    if (data.code) {
      const existing = await this.territoryRepo.findByCode(organizationId, data.code);
      if (existing) throw AppError.badRequest(`Territory code '${data.code}' is already in use within this organization.`);
    }

    const territory = await this.territoryRepo.create({ ...data, organizationId });

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'territory.create',
      moduleName: 'organization',
      details: { territoryId: territory.id, name: territory.name },
      req,
    });

    return territory;
  }

  async updateTerritory(id, organizationId, data, req) {
    const territory = await this.territoryRepo.findById(id, organizationId);
    if (!territory) throw AppError.notFound('Territory not found.');

    if (data.code && data.code !== territory.code) {
      const existing = await this.territoryRepo.findByCode(organizationId, data.code);
      if (existing) throw AppError.badRequest(`Territory code '${data.code}' is already in use within this organization.`);
    }

    const updated = await this.territoryRepo.update(id, data);

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'territory.update',
      moduleName: 'organization',
      details: { territoryId: id, changes: data },
      req,
    });

    return updated;
  }

  async deleteTerritory(id, organizationId, req) {
    const territory = await this.territoryRepo.findById(id, organizationId);
    if (!territory) throw AppError.notFound('Territory not found.');

    if (territory._count.teams > 0 || territory._count.users > 0) {
      throw AppError.conflict('Cannot delete territory while teams or users are assigned.');
    }

    const deleted = await this.territoryRepo.delete(id);

    if (req?.user?.id) {
      await logAudit({
        organizationId,
        userId: req.user.id,
        action: 'territory.delete',
        moduleName: 'organization',
        details: { territoryId: id, name: territory.name },
        req,
      }).catch(err => console.warn('Audit log warning:', err.message));
    }

    return deleted;
  }
  
  async restoreTerritory(id, organizationId, req) {
    const territory = await this.territoryRepo.findById(id, organizationId);
    if (!territory) throw AppError.notFound('Territory not found.');

    await logAudit({
      organizationId,
      userId: req.user.id,
      action: 'territory.restore.rejected',
      moduleName: 'organization',
      details: { territoryId: id, reason: 'Soft delete fields unavailable in Prisma schema.' },
      req,
    });

    throw AppError.conflict('Territory restore is unavailable because the current Prisma schema does not provide soft-delete fields.');
  }
}
