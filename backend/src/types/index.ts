import { Request } from 'express';
import { AuthPayload } from '../../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface LoadFilterQuery extends PaginationQuery {
  status?: string;
  driverId?: string;
  sourcePlatform?: string;
  search?: string;
}

export interface DriverFilterQuery extends PaginationQuery {
  status?: string;
  search?: string;
}
