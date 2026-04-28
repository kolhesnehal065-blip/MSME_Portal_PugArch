const BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || '';

export const api = {
  fetch: (endpoint: string, options: RequestInit = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = { ...options.headers as any };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      credentials: 'include',
      ...options,
      headers,
    });
  },
  
  get: (endpoint: string, options: RequestInit = {}) => 
    api.fetch(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, body: any, options: RequestInit = {}) => 
    api.fetch(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
    
  put: (endpoint: string, body: any, options: RequestInit = {}) => 
    api.fetch(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
    
  delete: (endpoint: string, options: RequestInit = {}) => 
    api.fetch(endpoint, { ...options, method: 'DELETE' }),
};
