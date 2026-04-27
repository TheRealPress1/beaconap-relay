import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-primary/85 px-8 py-4 backdrop-blur-xl">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[12.5px] text-text-tertiary">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
