import { AppError } from '../../shared/response.js';
import { locationService } from '../../services/location.service.js';

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

  async list(organizationId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(100, parseInt(query.limit) || 50);
    const skip = (page - 1) * limit;
    const search = query.search;

    return this.repo.findAll(organizationId, { skip, take: limit, search });
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

    return this.repo.create({
      ...data,
      organizationId,
      latitude: lat,
      longitude: lng,
    });
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
      lat = geo.latitude;
      lng = geo.longitude;
    }

    return this.repo.update(id, organizationId, {
      ...data,
      latitude: lat,
      longitude: lng,
    });
  }

  async delete(id, organizationId) {
    await this.getById(id, organizationId);
    return this.repo.delete(id, organizationId);
  }
}
