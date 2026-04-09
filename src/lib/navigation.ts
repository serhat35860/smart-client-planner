import {
  CalendarClock,
  LayoutDashboard,
  ListTodo,
  Search,
  Users,
  UsersRound,
  type LucideIcon
} from "lucide-react";

export type NavItem = {
  href: string;
  key: "dashboard" | "clients" | "tasks" | "reminders" | "team" | "search";
  icon: LucideIcon;
};

export const appNavItems: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/clients", key: "clients", icon: Users },
  { href: "/tasks", key: "tasks", icon: ListTodo },
  { href: "/reminders", key: "reminders", icon: CalendarClock },
  { href: "/team", key: "team", icon: UsersRound },
  { href: "/search", key: "search", icon: Search }
];
