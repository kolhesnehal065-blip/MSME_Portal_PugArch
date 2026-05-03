const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const BASE_URL = import.meta.env.DEV ? '' : rawBaseUrl.replace(/\/$/, '');

const resolveUrl = (endpoint: string) => {
  if (endpoint.startsWith('http')) return endpoint;

  if (!import.meta.env.DEV && !BASE_URL) {
    throw new Error('VITE_API_URL is not configured for this deployment');
  }

  if (
    !import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    BASE_URL &&
    new URL(BASE_URL).origin === window.location.origin
  ) {
    throw new Error('VITE_API_URL points to the frontend deployment instead of the backend API');
  }

  return `${BASE_URL}${endpoint}`;
};

export const api = {
  fetch: (endpoint: string, options: RequestInit = {}) => {
    const url = resolveUrl(endpoint);
    
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
