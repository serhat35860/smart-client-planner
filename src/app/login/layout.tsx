import type { Metadata } from "next";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("login") };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
