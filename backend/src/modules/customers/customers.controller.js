import { successResponse } from '../../shared/response.js';

export class CustomerController {
  constructor(customerService) {
    this.service = customerService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.service.list(req.user.organizationId, req.query, req.user);
      return successResponse(res, {
        customers: result.customers,
        total: result.total,
      }, 'Customers retrieved successfully.');
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const customer = await this.service.getById(req.params.id, req.user.organizationId);
      return successResponse(res, customer, 'Customer retrieved successfully.');
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const customer = await this.service.create(req.user.organizationId, req.body);
      return successResponse(res, customer, 'Customer created successfully.', 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const customer = await this.service.update(req.params.id, req.user.organizationId, req.body);
      return successResponse(res, customer, 'Customer updated successfully.');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id, req.user.organizationId);
      return successResponse(res, null, 'Customer deleted successfully.');
    } catch (err) {
      next(err);
    }
  };
}
