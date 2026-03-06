import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <div className="bg-white border-b -mx-4 -mt-6 mb-6 px-4 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
