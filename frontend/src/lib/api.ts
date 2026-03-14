import type {
  GenerateRequest,
  GenerateResponse,
  ValidationResult,
  GenerationHistory,
  Template,
} from '@/types';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Unknown error');
    throw new ApiError(res.status, errorBody);
  }

  return res.json();
}

export const api = {
  generate(req: GenerateRequest): Promise<GenerateResponse> {
    return request<GenerateResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  validate(code: string): Promise<ValidationResult> {
    return request<ValidationResult>('/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async downloadZip(id: string): Promise<void> {
    const url = `${API_BASE}/download/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new ApiError(res.status, 'Download failed');

    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `terraform-${id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  getHistory(): Promise<GenerationHistory[]> {
    return request<GenerationHistory[]>('/history');
  },

  getGeneration(id: string): Promise<GenerateResponse> {
    return request<GenerateResponse>(`/generation/${id}`);
  },

  getTemplates(): Promise<Template[]> {
    return request<Template[]>('/templates');
  },
};
