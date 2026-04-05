export type ReportRowKind = "client" | "note" | "task_created" | "task_completed";

export type ReportRowJson = {
  id: string;
  kind: ReportRowKind;
  at: string;
  title: string;
  detail: string;
  clientName: string | null;
  createdBy: string | null;
};

export type ReportApiResponse = {
  workspaceName: string;
  from: string;
  to: string;
  rows: ReportRowJson[];
};
