import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AppHeaderBack({
  title,
  to = "/app",
  right,
}: {
  title: string;
  to?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <Link to={to} className="grid size-9 place-items-center rounded-lg hover:bg-muted">
        <ArrowLeft className="size-5" />
      </Link>
      <h1 className="font-display text-lg font-bold">{title}</h1>
      <div className="min-w-9">{right}</div>
    </div>
  );
}
