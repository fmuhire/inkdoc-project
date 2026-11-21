import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: Props) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10 dark:text-brand-200">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
