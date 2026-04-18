export type ReportRowKind =
  | "client"
  | "client_updated"
  | "note"
  | "note_updated"
  | "task_created"
  | "task_completed"
  | "task_failed"
  | "task_updated"
  | "tag_created"
  | "audit";

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
  totalRows: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
