const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'exhibition_hub_token';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // localStorage not available
    }

    return headers;
  }

  private async request<T>(method: string, path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('exhibition_hub_user');
      window.location.href = '/auth';
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorBody.error || `Request failed: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  post<T>(path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', path, body, params);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const api = new ApiClient(BASE_URL);
