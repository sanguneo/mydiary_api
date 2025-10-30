import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { logger } from '@/lib/logger';
import type { IErrorContext, TApiErrorResponse } from '@/types/common/common.types';

/**
 * AppError는 서비스 계층에서 일관된 에러 표현을 제공하기 위한 커스텀 에러입니다.
 * - status: HTTP 상태 코드
 * - code: 클라이언트/로거에서 구분하기 위한 식별자
 * - details: 추가 디버깅 정보(선택)
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { status?: number; code?: string; details?: unknown; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.status = options.status ?? 500;
    this.code = options.code ?? 'internal_error';
    this.details = options.details;
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  static normalize(
    error: unknown,
    fallback: { message: string; status?: number; code?: string; details?: unknown } = { message: 'Internal server error' },
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(fallback.message, {
      status: fallback.status,
      code: fallback.code,
      details: fallback.details,
      cause: error instanceof Error ? error : undefined,
    });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 라우트 핸들러에서 일관된 JSON 에러 응답을 반환하기 위한 헬퍼.
 * 내부적으로 AppError로 정규화하고, 로그 레벨도 상태코드에 따라 분기한다.
 */
export function handleRouteError(
  c: Context,
  error: unknown,
  fallback: { message: string; status?: number; code?: string; details?: unknown },
  context: IErrorContext = {},
) {
  const appError = AppError.normalize(error, fallback);
  const requestContext: IErrorContext = {
    requestId: c.get('requestId'),
    path: c.req.path,
    method: c.req.method,
    userId: c.get('user')?.id,
    ...context,
  };

  const logPayload = {
    ...requestContext,
    details: appError.details,
    cause: appError.cause ?? (error instanceof Error ? error : undefined),
  };

  if (appError.status >= 500) {
    logger.error(logPayload, appError.message);
  } else {
    logger.warn(logPayload, appError.message);
  }

  const response: TApiErrorResponse = {
    ok: false,
    code: appError.code,
    message: appError.message,
    details: appError.details ?? null,
  };

  return c.json(response, appError.status as ContentfulStatusCode);
}
