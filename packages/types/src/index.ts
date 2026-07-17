export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string | string[];
  errors: unknown[];
  path: string;
  timestamp: string;
}
