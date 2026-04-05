export type TaskListFilter = "all" | "incomplete" | "completed";

/** `taskFilter` sorgu parametresi; panelde eski `?activeTasks=incomplete` bağlantıları da okunur. */
export function parseTaskListFilter(
  taskFilter: string | undefined,
  legacyActiveTasks?: string
): TaskListFilter {
  if (taskFilter === "incomplete" || taskFilter === "completed") return taskFilter;
  if (legacyActiveTasks === "incomplete") return "incomplete";
  return "all";
}
