import { successResponse, createdResponse, AppError } from '../../../shared/response.js';
import {
  importQuerySchema,
  mapProductSchema,
  mapBranchSchema,
  mapTerritorySchema,
} from '../validators/crm-integration.validation.js';

export class CRMIntegrationController {
  constructor(service) {
    this.service = service;
  }

  importExcel = async (req, res, next) => {
    try {
      const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
      if (!file) {
        throw AppError.badRequest('Please attach an Excel file (.xlsx or .xls) in form-data with key "file"');
      }

      const result = await this.service.processExcelImport(file, req.user);
      return createdResponse(res, 'CRM Excel data imported successfully', result);
    } catch (error) {
      next(error);
    }
  };

  listImports = async (req, res, next) => {
    try {
      const query = importQuerySchema.parse(req.query);
      const result = await this.service.listImports(req.user.organizationId, query);
      return successResponse(res, result.imports, 'CRM imports list retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getImportById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.getImportById(id, req.user.organizationId);
      return successResponse(res, result, 'CRM import details retrieved');
    } catch (error) {
      next(error);
    }
  };

  mapProduct = async (req, res, next) => {
    try {
      const { id } = req.params; // rowId
      const { productId } = mapProductSchema.parse(req.body);
      const result = await this.service.mapProduct(id, req.user.organizationId, productId);
      return successResponse(res, result, 'Product mapped successfully');
    } catch (error) {
      next(error);
    }
  };

  mapBranch = async (req, res, next) => {
    try {
      const { id } = req.params; // rowId
      const { branchId } = mapBranchSchema.parse(req.body);
      const result = await this.service.mapBranch(id, req.user.organizationId, branchId);
      return successResponse(res, result, 'Branch mapped successfully');
    } catch (error) {
      next(error);
    }
  };

  mapTerritory = async (req, res, next) => {
    try {
      const { id } = req.params; // rowId
      const { territoryId } = mapTerritorySchema.parse(req.body);
      const result = await this.service.mapTerritory(id, req.user.organizationId, territoryId);
      return successResponse(res, result, 'Territory mapped successfully');
    } catch (error) {
      next(error);
    }
  };

  getTemplate = async (req, res, next) => {
    try {
      const buffer = this.service.getTemplate();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="CRM_Import_Template.xlsx"');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  exportData = async (req, res, next) => {
    try {
      const { importId } = req.query;
      const buffer = await this.service.exportMappedData(req.user.organizationId, importId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="CRM_Mapped_Export_${Date.now()}.xlsx"`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  convertToOrders = async (req, res, next) => {
    try {
      const { id } = req.params; // importId
      const result = await this.service.convertToOrders(id, req.user);
      return successResponse(res, result, 'CRM import rows successfully converted into Sales Orders', 200);
    } catch (error) {
      next(error);
    }
  };
}
