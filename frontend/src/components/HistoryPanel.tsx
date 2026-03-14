import { useEffect, useState } from 'react';
import {
  X,
  Clock,
  FileCode2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import type { GenerationHistory, CloudProvider } from '@/types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const PROVIDER_COLORS: Record<CloudProvider, string> = {
  aws: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  gcp: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  azure: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const PROVIDER_LABELS: Record<CloudProvider, string> = {
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function HistoryPanel({
  isOpen,
  onClose,
  onSelect,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      api
        .getHistory()
        .then(setHistory)
        .catch((err) => {
          setError(err.message || 'Failed to load history');
          // Use mock data for demo when backend is not available
          setHistory([
            {
              id: 'demo-1',
              description:
                'VPC with public and private subnets, NAT gateway',
              provider: 'aws',
              security_level: 'strict',
              file_count: 4,
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'demo-2',
              description:
                'GKE cluster with Workload Identity and Cloud Armor',
              provider: 'gcp',
              security_level: 'standard',
              file_count: 3,
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'demo-3',
              description:
                'AKS cluster with Azure AD integration',
              provider: 'azure',
              security_level: 'strict',
              file_count: 5,
              created_at: new Date(
                Date.now() - 172800000
              ).toISOString(),
            },
          ]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-[400px] max-w-full bg-vscode-sidebar
        border-l border-vscode-border z-50 flex flex-col animate-slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-vscode-border">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-vscode-accent" />
            <h2 className="text-base font-semibold">Generation History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-vscode-active text-vscode-text-muted
              hover:text-vscode-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-vscode-accent" />
            </div>
          ) : error && history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-vscode-text-muted">
              <AlertCircle className="w-6 h-6" />
              <p className="text-sm">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-vscode-text-muted">
              <Clock className="w-6 h-6 opacity-40" />
              <p className="text-sm">No generation history yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded hover:bg-vscode-active/70
                    transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm text-vscode-text line-clamp-2 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded border text-xs font-medium',
                        PROVIDER_COLORS[item.provider]
                      )}
                    >
                      {PROVIDER_LABELS[item.provider]}
                    </span>
                    <span className="flex items-center gap-1 text-vscode-text-muted">
                      <FileCode2 className="w-3 h-3" />
                      {item.file_count} files
                    </span>
                    <span className="text-vscode-text-muted ml-auto">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
