import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCode2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import FileTab from './FileTab';
import type { GeneratedFile, ValidationResult } from '@/types';

interface CodeViewerProps {
  files: GeneratedFile[];
  validation: ValidationResult | null;
  generationId: string | null;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export default function CodeViewer({
  files,
  validation,
  generationId,
  onDownloadZip,
  isDownloading,
}: CodeViewerProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = files[activeFileIndex] || null;

  const handleCopy = useCallback(async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeFile]);

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-vscode-text-muted gap-4">
        <FileCode2 className="w-16 h-16 opacity-30" />
        <div className="text-center">
          <p className="text-lg font-medium mb-1">No code generated yet</p>
          <p className="text-sm">
            Describe your infrastructure and click Generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* File Tabs Row */}
      <div className="flex items-center bg-vscode-tab-inactive border-b border-vscode-border overflow-x-auto">
        <div className="flex flex-1 min-w-0 overflow-x-auto">
          {files.map((file, index) => (
            <FileTab
              key={file.filename}
              filename={file.filename}
              description={file.description}
              isActive={index === activeFileIndex}
              onClick={() => setActiveFileIndex(index)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 px-2 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-vscode-active text-vscode-text-muted
              hover:text-vscode-text transition-colors"
            title="Copy file content"
          >
            {copied ? (
              <Check className="w-4 h-4 text-vscode-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {generationId && (
            <button
              onClick={onDownloadZip}
              disabled={isDownloading}
              className="p-1.5 rounded hover:bg-vscode-active text-vscode-text-muted
                hover:text-vscode-text transition-colors disabled:opacity-50"
              title="Download all files as ZIP"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      {activeFile && (
        <div className="flex items-center gap-2 px-4 py-1 text-xs text-vscode-text-muted bg-vscode-bg border-b border-vscode-border">
          <span className="text-vscode-info">{activeFile.filename}</span>
          <span className="opacity-50">-</span>
          <span>{activeFile.description}</span>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="hcl"
          theme="vs-dark"
          value={activeFile?.content ?? ''}
          options={{
            readOnly: false,
            minimap: { enabled: true, scale: 1 },
            fontSize: 14,
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12 },
            bracketPairColorization: { enabled: true },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>

      {/* Validation Status Bar */}
      {validation && (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-2 text-sm border-t border-vscode-border',
            validation.valid
              ? 'bg-emerald-500/10'
              : 'bg-red-500/10'
          )}
        >
          {validation.valid ? (
            <CheckCircle2 className="w-4 h-4 text-vscode-success shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-vscode-error shrink-0" />
          )}
          <span
            className={
              validation.valid ? 'text-vscode-success' : 'text-vscode-error'
            }
          >
            {validation.valid
              ? 'Validation passed'
              : `${validation.errors.length} error(s)`}
          </span>
          {validation.warnings.length > 0 && (
            <span className="flex items-center gap-1 text-vscode-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              {validation.warnings.length} warning(s)
            </span>
          )}
          {!validation.valid && validation.errors.length > 0 && (
            <span className="text-vscode-text-muted text-xs truncate">
              {validation.errors[0]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
