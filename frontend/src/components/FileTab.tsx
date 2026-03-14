import { FileCode2, FileText, FileKey, Settings, File } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FileTabProps {
  filename: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

function getFileIcon(filename: string) {
  if (filename.includes('variable')) return FileKey;
  if (filename.includes('output')) return FileText;
  if (filename.includes('provider') || filename.includes('backend'))
    return Settings;
  if (filename.endsWith('.tf')) return FileCode2;
  return File;
}

function getFileColor(filename: string) {
  if (filename === 'main.tf') return 'text-purple-400';
  if (filename.includes('variable')) return 'text-yellow-400';
  if (filename.includes('output')) return 'text-green-400';
  if (filename.includes('provider')) return 'text-blue-400';
  if (filename.includes('backend')) return 'text-orange-400';
  return 'text-vscode-text-muted';
}

export default function FileTab({
  filename,
  description,
  isActive,
  onClick,
}: FileTabProps) {
  const Icon = getFileIcon(filename);
  const color = getFileColor(filename);

  return (
    <button
      onClick={onClick}
      title={description}
      className={cn(
        'group flex items-center gap-2 px-4 py-2 text-sm border-r border-vscode-border',
        'transition-colors duration-100 relative shrink-0',
        isActive
          ? 'bg-vscode-tab-active text-white'
          : 'bg-vscode-tab-inactive text-vscode-text-muted hover:text-vscode-text hover:bg-vscode-active/50'
      )}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-vscode-accent" />
      )}
      <Icon className={cn('w-4 h-4', isActive ? color : 'text-vscode-text-muted group-hover:' + color)} />
      <span className="whitespace-nowrap">{filename}</span>
    </button>
  );
}
