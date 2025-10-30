// src/types/common/common.types.ts

export type TApiSuccessResponse<T> = {
  ok: true;
  data: T;
  message?: string;
};

export type TApiErrorResponse = {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
};

export type TApiResponse<T> = TApiSuccessResponse<T> | TApiErrorResponse;

export interface IErrorContext {
  requestId?: string;
  path?: string;
  method?: string;
  userId?: string;
}
