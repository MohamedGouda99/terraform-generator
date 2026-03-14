import { useState } from 'react';
import {
  Cloud,
  Shield,
  ShieldCheck,
  Plus,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CloudProvider, SecurityLevel } from '@/types';

const PROVIDERS: { id: CloudProvider; label: string; color: string }[] = [
  { id: 'aws', label: 'AWS', color: 'text-orange-400' },
  { id: 'gcp', label: 'GCP', color: 'text-blue-400' },
  { id: 'azure', label: 'Azure', color: 'text-cyan-400' },
];

const EXAMPLE_PROMPTS = [
  'VPC with public and private subnets, NAT gateway, and bastion host',
  'EKS cluster with managed node groups and autoscaling',
  'S3 bucket with CloudFront CDN and WAF protection',
  'RDS PostgreSQL with read replicas and automated backups',
  'Lambda API with API Gateway, DynamoDB, and Cognito auth',
  'GKE cluster with Workload Identity and Cloud Armor',
];

interface DescriptionInputProps {
  description: string;
  provider: CloudProvider;
  securityLevel: SecurityLevel;
  requirements: string[];
  isGenerating: boolean;
  onDescriptionChange: (value: string) => void;
  onProviderChange: (provider: CloudProvider) => void;
  onSecurityLevelChange: (level: SecurityLevel) => void;
  onRequirementsChange: (requirements: string[]) => void;
  onGenerate: () => void;
}

export default function DescriptionInput({
  description,
  provider,
  securityLevel,
  requirements,
  isGenerating,
  onDescriptionChange,
  onProviderChange,
  onSecurityLevelChange,
  onRequirementsChange,
  onGenerate,
}: DescriptionInputProps) {
  const [newRequirement, setNewRequirement] = useState('');

  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (trimmed && !requirements.includes(trimmed)) {
      onRequirementsChange([...requirements, trimmed]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (req: string) => {
    onRequirementsChange(requirements.filter((r) => r !== req));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRequirement();
    }
  };

  const handlePromptClick = (prompt: string) => {
    onDescriptionChange(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cloud Provider Tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2">
        <Cloud className="w-4 h-4 text-vscode-text-muted mr-2" />
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProviderChange(p.id)}
            className={cn(
              'provider-tab',
              provider === p.id
                ? 'provider-tab-active'
                : 'provider-tab-inactive'
            )}
          >
            <span className={provider === p.id ? p.color : ''}>
              {p.label}
            </span>
          </button>
        ))}
      </div>

      {/* Security Level Toggle */}
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="text-xs text-vscode-text-muted uppercase tracking-wide">
          Security
        </span>
        <button
          onClick={() =>
            onSecurityLevelChange(
              securityLevel === 'standard' ? 'strict' : 'standard'
            )
          }
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200',
            securityLevel === 'strict'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-vscode-input border border-vscode-border text-vscode-text-muted'
          )}
        >
          {securityLevel === 'strict' ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {securityLevel === 'strict' ? 'Strict' : 'Standard'}
        </button>
        <span className="text-xs text-vscode-text-muted">
          {securityLevel === 'strict'
            ? 'Encryption, logging, least-privilege IAM'
            : 'Functional defaults'}
        </span>
      </div>

      {/* Description Textarea */}
      <div className="flex-1 px-4 py-2 flex flex-col min-h-0">
        <label className="text-xs text-vscode-text-muted uppercase tracking-wide mb-2">
          Describe your infrastructure
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the infrastructure you need... e.g., 'A production-ready VPC with public and private subnets, NAT gateway, and a bastion host for SSH access'"
          className="input-field flex-1 resize-none font-mono text-sm leading-relaxed min-h-[120px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onGenerate();
            }
          }}
        />
        <div className="text-xs text-vscode-text-muted mt-1 text-right">
          Ctrl+Enter to generate
        </div>
      </div>

      {/* Requirements Chips */}
      <div className="px-4 py-2">
        <label className="text-xs text-vscode-text-muted uppercase tracking-wide mb-2 block">
          Requirements
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {requirements.map((req) => (
            <span key={req} className="chip chip-active">
              {req}
              <button
                onClick={() => removeRequirement(req)}
                className="hover:text-vscode-error transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add requirement..."
            className="input-field flex-1 text-sm"
          />
          <button
            onClick={addRequirement}
            disabled={!newRequirement.trim()}
            className="btn-secondary px-3 py-1.5"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="px-4 py-2 border-t border-vscode-border">
        <label className="text-xs text-vscode-text-muted uppercase tracking-wide mb-2 block">
          Example prompts
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className="text-xs text-left px-2.5 py-1.5 rounded bg-vscode-input/60
                border border-vscode-border/50 text-vscode-text-muted
                hover:text-vscode-text hover:border-vscode-accent/50
                hover:bg-vscode-input transition-all duration-150"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="p-4 border-t border-vscode-border">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !description.trim()}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Terraform...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Terraform
            </>
          )}
        </button>
      </div>
    </div>
  );
}
