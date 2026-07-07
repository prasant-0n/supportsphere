export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      message: string;
    }>;
    requestId?: string;
    timestamp: string;
  };
}

export interface HealthStatus {
  status: 'ok' | 'ready' | 'degraded';
  checks?: Record<string, 'up' | 'down'>;
}
