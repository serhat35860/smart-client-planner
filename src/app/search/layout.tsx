import type { Metadata } from "next";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("global_search") };
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
