/**
 * Next.js App Router Route Test Harness
 * Provides clean invocation wrappers and request factories for testing
 * Next.js 14 API route handlers in a Node.js / Vitest environment.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RouteRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  searchParams?: Record<string, string | number | boolean | undefined>;
  body?: any;
}

export interface RouteHandlerResult<T = any> {
  response: Response;
  status: number;
  ok: boolean;
  headers: Headers;
  json: () => Promise<T>;
  text: () => Promise<string>;
  buffer: () => Promise<Buffer>;
  getHeader: (name: string) => string | null;
}

const DEFAULT_BASE_URL = 'http://localhost:3000';

/**
 * Normalizes a URL and appends search params if provided.
 */
export function buildTestUrl(
  pathOrUrl: string,
  searchParams?: Record<string, string | number | boolean | undefined>
): string {
  const isAbsolute = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://');
  const fullUrl = isAbsolute ? pathOrUrl : `${DEFAULT_BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  const parsed = new URL(fullUrl);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        parsed.searchParams.set(key, String(value));
      }
    });
  }

  return parsed.toString();
}

/**
 * Creates a NextRequest with arbitrary method, headers, query params, and body.
 */
export function createTestRequest(
  pathOrUrl: string,
  options: RouteRequestOptions = {}
): NextRequest {
  const url = buildTestUrl(pathOrUrl, options.searchParams);
  const method = (options.method || 'GET').toUpperCase();

  const headers = new Headers(options.headers || {});

  let body: BodyInit | null | undefined = undefined;

  if (options.body !== undefined && options.body !== null && method !== 'GET' && method !== 'HEAD') {
    if (typeof options.body === 'string') {
      body = options.body;
      if (!headers.has('content-type')) {
        headers.set('content-type', 'text/plain; charset=utf-8');
      }
    } else if (Buffer.isBuffer(options.body)) {
      body = options.body as unknown as BodyInit;
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/octet-stream');
      }
    } else {
      body = JSON.stringify(options.body);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    }
  }

  return new NextRequest(url, {
    method,
    headers,
    body,
  });
}

/**
 * Creates a JSON POST/PUT/PATCH request.
 */
export function createJsonRequest(
  pathOrUrl: string,
  bodyData: any,
  options: Omit<RouteRequestOptions, 'body'> = {}
): NextRequest {
  return createTestRequest(pathOrUrl, {
    ...options,
    method: options.method || 'POST',
    body: bodyData,
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Creates a GET request with optional query params.
 */
export function createGetRequest(
  pathOrUrl: string,
  options: Omit<RouteRequestOptions, 'method' | 'body'> = {}
): NextRequest {
  return createTestRequest(pathOrUrl, {
    ...options,
    method: 'GET',
  });
}

/**
 * Creates a raw string or payload request (e.g. for Stripe webhook signature verification).
 */
export function createRawRequest(
  pathOrUrl: string,
  rawBody: string,
  options: Omit<RouteRequestOptions, 'body'> = {}
): NextRequest {
  return createTestRequest(pathOrUrl, {
    ...options,
    method: options.method || 'POST',
    body: rawBody,
  });
}

/**
 * Executes a Next.js App Router route handler cleanly and wraps the response
 * for convenient testing assertions.
 */
export async function invokeRouteHandler<T = any>(
  handler: (req: NextRequest, ...args: any[]) => Promise<Response>,
  req: NextRequest,
  ...contextArgs: any[]
): Promise<RouteHandlerResult<T>> {
  const response = await handler(req, ...contextArgs);

  // Clone response so multiple readers (json, text, buffer) don't conflict
  const cloned = response.clone();

  return {
    response,
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    getHeader: (name: string) => response.headers.get(name),
    json: async (): Promise<T> => {
      const res = cloned.clone();
      return res.json();
    },
    text: async (): Promise<string> => {
      const res = cloned.clone();
      return res.text();
    },
    buffer: async (): Promise<Buffer> => {
      const res = cloned.clone();
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    },
  };
}
