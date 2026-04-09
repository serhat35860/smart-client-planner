import Link from "next/link";
import { Bell, CheckCircle2, FileText, ListTodo, type LucideIcon } from "lucide-react";

const ICONS = {
  notes: FileText,
  reminders: Bell,
  tasks: ListTodo,
  done: CheckCircle2,
  incomplete: ListTodo
} as const;

export type DashboardEmptyIcon = keyof typeof ICONS;

export function DashboardEmptyState({
  message,
  actionHref,
  actionLabel,
  icon
}: {
  message: string;
  actionHref: string;
  actionLabel: string;
  icon: DashboardEmptyIcon;
}) {
  const Icon: LucideIcon = ICONS[icon] ?? FileText;
  return (
    <div className="ui-empty-state dashboard-empty-premium flex flex-col items-center gap-3 rounded-2xl px-4 py-7 text-center shadow-sm">
      <Icon
        className="h-9 w-9 shrink-0 text-theme-muted opacity-[0.85] sm:h-10 sm:w-10"
        aria-hidden
        strokeWidth={1.65}
      />
      <p className="max-w-sm text-body font-medium leading-[1.58] text-theme-text">{message}</p>
      <Link
        href={actionHref}
        className="text-button font-semibold text-theme-primary underline-offset-2 transition hover:underline"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
