export type CloudProvider = 'aws' | 'gcp' | 'azure';
export type SecurityLevel = 'standard' | 'strict';

export interface GenerateRequest {
  description: string;
  provider: CloudProvider;
  security_level: SecurityLevel;
  requirements: string[];
}

export interface GeneratedFile {
  filename: string;
  content: string;
  description: string;
  language: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GenerateResponse {
  id: string;
  files: GeneratedFile[];
  security_notes: string[];
  estimated_cost: string;
  validation: ValidationResult;
  provider: CloudProvider;
  created_at: string;
}

export interface GenerationHistory {
  id: string;
  description: string;
  provider: CloudProvider;
  security_level: SecurityLevel;
  file_count: number;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  provider: CloudProvider;
  prompt: string;
  tags: string[];
}
