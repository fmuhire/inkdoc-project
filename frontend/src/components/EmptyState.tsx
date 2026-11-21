import type { ReactNode } from "react";

interface Props {
  kicker: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({ kicker, title, description, children }: Props) {
  return (
    <div className="border-y border-rule py-16 text-center">
      <p className="meta uppercase">{kicker}</p>
      <h2 className="mt-3 font-serif text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-2">{description}</p>
      {children && <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
