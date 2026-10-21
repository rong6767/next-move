import type { Metadata } from "next";
import { I18nProvider } from "../lib/i18n";
import "./globals.css";
export const metadata: Metadata = {
  title: "下一站 · Next Move",
  description: "和 dot 一起整理岗位、保存 JD、追踪投递与面试进度。Organize roles, save job descriptions, and track applications with dot.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><I18nProvider>{children}</I18nProvider></body></html>;
}
