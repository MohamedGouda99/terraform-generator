import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface SecurityNotesProps {
  notes: string[];
  estimatedCost: string;
}

export default function SecurityNotes({
  notes,
  estimatedCost,
}: SecurityNotesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (notes.length === 0 && !estimatedCost) return null;

  return (
    <div className="border-t border-vscode-border bg-vscode-sidebar">
      {/* Header toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-vscode-text
          hover:bg-vscode-active/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-vscode-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-vscode-text-muted" />
        )}
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="font-medium">Security Notes & Cost Estimate</span>
        <span className="ml-auto text-xs text-vscode-text-muted">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Cost Estimate */}
          {estimatedCost && (
            <div className="flex items-start gap-3 p-3 rounded bg-vscode-bg border border-vscode-border">
              <DollarSign className="w-4 h-4 text-vscode-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-vscode-warning">
                  Estimated Monthly Cost
                </p>
                <p className="text-sm text-vscode-text mt-0.5">
                  {estimatedCost}
                </p>
              </div>
            </div>
          )}

          {/* Security Notes */}
          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((note, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded border text-sm',
                    note.toLowerCase().includes('warning') ||
                      note.toLowerCase().includes('caution')
                      ? 'bg-yellow-500/5 border-yellow-500/20'
                      : 'bg-vscode-bg border-vscode-border'
                  )}
                >
                  <Info
                    className={cn(
                      'w-4 h-4 mt-0.5 shrink-0',
                      note.toLowerCase().includes('warning') ||
                        note.toLowerCase().includes('caution')
                        ? 'text-vscode-warning'
                        : 'text-vscode-info'
                    )}
                  />
                  <p className="text-vscode-text leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
