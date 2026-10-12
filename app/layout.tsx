import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "下一站 · 求职工作台",
  description: "和 dot 一起整理岗位、保存 JD、追踪投递与面试进度。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
