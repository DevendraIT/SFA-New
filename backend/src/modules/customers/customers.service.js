import { AppError } from '../../shared/response.js';
import { locationService } from '../../services/location.service.js';
import cacheService from '../../shared/cache/cache.service.js';

function formatAddressString(address) {
  if (!address) return null;
  if (typeof address === 'string') return address.trim() || null;
  if (typeof address === 'object') {
    const parts = [
      address.street || address.addressLine1 || address.address,
      address.city,
      address.state,
      address.postalCode || address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }
  return null;
}

export class CustomerService {
  constructor(customerRepository) {
    this.repo = customerRepository;
  }

  _invalidateCustomerCache(orgId) {
    if (!orgId) return;
    cacheService.invalidatePrefixes([
      `${orgId}:customers:`,
      `${orgId}:sales:`,
      `${orgId}:dashboard:`,
    ]);
  }

  async list(organizationId, query = {}, userContext = null) {
    const cacheKey = cacheService.buildKey({
      orgId: organizationId,
      module: 'customers',
      resource: 'list',
      scopeId: userContext?.id || 'all',
      params: query,
    });

    return cacheService.getOrSet(cacheKey, async () => {
      const page = parseInt(query.page) || 1;
      const limit = Math.min(100, parseInt(query.limit) || 50);
      const skip = (page - 1) * limit;
      const search = query.search;

      const userRoles = (userContext?.roles || []).map(r => 
        typeof r === 'string' ? r : (r.role?.name || r.name || '')
      );
      const isGlobalAdmin = userRoles.some(r => 
        ['organization super admin', 'super admin', 'company admin', 'head of sales', 'administrator'].includes(r.toLowerCase())
      );

      const branchId = !isGlobalAdmin ? (userContext?.branchId || query.branchId) : query.branchId;

      return this.repo.findAll(organizationId, { skip, take: limit, search, branchId, userId: userContext?.id });
    }, 180); // 3 minutes TTL
  }

  async getById(id, organizationId) {
    const customer = await this.repo.findById(id, organizationId);
    if (!customer) throw AppError.notFound('Customer not found');
    return customer;
  }

  async create(organizationId, data) {
    let lat = data.latitude ? parseFloat(data.latitude) : null;
    let lng = data.longitude ? parseFloat(data.longitude) : null;
    const addressStr = formatAddressString(data.address);

    if ((!lat || !lng) && addressStr) {
      const geo = await locationService.geocodeAddress(addressStr);
      lat = geo.latitude;
      lng = geo.longitude;
    }

    const created = await this.repo.create({
      ...data,
      organizationId,
      latitude: lat,
      longitude: lng,
    });

    this._invalidateCustomerCache(organizationId);
    return created;
  }

  async update(id, organizationId, data) {
    const existing = await this.getById(id, organizationId);
    let lat = data.latitude !== undefined ? (data.latitude ? parseFloat(data.latitude) : null) : existing.latitude;
    let lng = data.longitude !== undefined ? (data.longitude ? parseFloat(data.longitude) : null) : existing.longitude;

    const newAddressStr = formatAddressString(data.address);
    const existingAddressStr = formatAddressString(existing.address);

    const addressChanged = newAddressStr && newAddressStr !== existingAddressStr;
    const missingCoords = !lat || !lng;

    if ((addressChanged || missingCoords) && newAddressStr) {
      const geo = await locationService.geocodeAddress(newAddressStr);
      if (geo?.latitude && geo?.longitude) {
        if (lat == null) lat = geo.latitude;
        if (lng == null) lng = geo.longitude;
      }
    }

    const updated = await this.repo.update(id, organizationId, {
      ...data,
      latitude: lat,
      longitude: lng,
    });

    this._invalidateCustomerCache(organizationId);
    return updated;
  }

  async delete(id, organizationId) {
    await this.getById(id, organizationId);
    const deleted = await this.repo.delete(id, organizationId);
    this._invalidateCustomerCache(organizationId);
    return deleted;
  }
}
