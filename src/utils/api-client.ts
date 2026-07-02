const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

async function request(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)

  // Set default JSON headers if not uploading files/FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Format query parameters if any
  let url = `${API_BASE_URL}${path}`
  if (options.params) {
    const searchParams = new URLSearchParams(options.params)
    url += `?${searchParams.toString()}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.detail?.message || errData.detail || `API Request failed with status ${response.status}`)
  }

  return response.json()
}

class DbQueryBuilder {
  private table: string;
  private method: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private body: any = null;
  private filters: { column: string; value: any }[] = [];
  private orderCol: string | null = null;
  private orderDesc = false;
  private limitVal: number | null = null;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    this.method = 'select';
    return this;
  }

  insert(values: any) {
    this.method = 'insert';
    this.body = values;
    return this;
  }

  update(values: any) {
    this.method = 'update';
    this.body = values;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderDesc = options?.ascending === false;
    return this;
  }

  limit(value: number) {
    this.limitVal = value;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Make query builder awaitable returning structure matching { data, error }
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const url = `/db/${this.table}`;
      const options: RequestInit = {
        method: 'GET',
      };

      const params: Record<string, string> = {};
      if (this.filters.length > 0) {
        params.filters = JSON.stringify(this.filters);
      }

      if (this.orderCol) {
        params.order_col = this.orderCol;
        params.order_desc = this.orderDesc ? 'true' : 'false';
      }

      if (this.limitVal !== null) {
        params.limit = String(this.limitVal);
      }

      if (this.isSingle) {
        params.single = 'true';
      }

      if (this.method === 'insert') {
        options.method = 'POST';
        options.body = JSON.stringify(this.body);
      } else if (this.method === 'update') {
        options.method = 'PUT';
        options.body = JSON.stringify(this.body);
      } else if (this.method === 'delete') {
        options.method = 'DELETE';
      }

      let queryPath = url;
      if (Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        queryPath += `?${searchParams.toString()}`;
      }

      const res = await request(queryPath, options);
      const output = { data: res, error: null };
      if (onfulfilled) {
        return onfulfilled(output);
      }
      return output;
    } catch (err: any) {
      const output = { data: null, error: err };
      if (onfulfilled) {
        return onfulfilled(output);
      }
      return output;
    }
  }
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  postFormData: (path: string, formData: FormData, options?: RequestOptions) => request(path, { ...options, method: 'POST', body: formData }),
  put: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'DELETE' }),
  db: (table: string) => new DbQueryBuilder(table),
}
