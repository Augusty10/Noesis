import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="mb-4 w-12 h-12 rounded-lg bg-greenDeep border border-greenMid flex items-center justify-center text-greenBright">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-textPrimary mb-1">{title}</h3>
      <p className="text-xs text-textMuted max-w-xs mb-5">{description}</p>
      {action}
    </div>
  );
}
