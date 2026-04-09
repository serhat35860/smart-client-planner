export type TaskListFilter = "mine" | "all" | "incomplete" | "completed";

/** `taskFilter` sorgu parametresi; panelde eski `?activeTasks=incomplete` bağlantıları da okunur. */
export function parseTaskListFilter(
  taskFilter: string | undefined,
  legacyActiveTasks?: string
): TaskListFilter {
  if (!taskFilter && !legacyActiveTasks) return "mine";
  if (taskFilter === "incomplete" || taskFilter === "completed") return taskFilter;
  if (taskFilter === "all") return "all";
  if (taskFilter === "mine") return "mine";
  if (legacyActiveTasks === "incomplete") return "incomplete";
  return "mine";
}
