# 下一站 · Next Move

一个支持中英双语的个人求职工作台：集中保存岗位和完整 JD，按公司整理机会，追踪投递、面试与下一步行动。

[双语主 README](README.md) · [English](README.md#english) · [中文完整介绍](README.md#chinese)

本仓库为私人使用产品的源码分发版本，候选数据为空。真实私人实例不作为公开 Demo；这里不提供私人站点链接或包含真实求职信息的截图。

## 产品与功能

求职信息往往散落在招聘页面、收藏、表格和沟通笔记里。下一站将这些信息集中起来，并区分“待考虑的机会”和“实际完成的投递”。

- 按公司、岗位列表或进度看板浏览；同一公司的多个岗位保留独立 JD、状态与时间线。
- 支持 JD 内容搜索、状态和优先级筛选、排序、分页，以及跨页导出全部匹配结果。
- 记录真实投递日期、简历版本、联系人、下一步行动和沟通笔记，查看逾期、今日与后续跟进。
- 切换中文和英文界面、日期、错误提示及 CSV 列名；已保存的 JD、笔记、标签和来源保留原文。
- 归档与恢复岗位，导出完整 JSON 备份或 CSV；导入跳过已有岗位，不覆盖现有进度。
- 通过授权的 MCP 工具让 dot 维护网站使用的同一份数据。

记录“已投递”不会向雇主发送简历。MCP 记录投递或后续状态需提供 `applicationEvidence` 说明；工具不代为申请或发送消息。工作台显示跟进日期，定时通知需要另外配置自动化。

## 技术实现

使用 React 19、TypeScript、Vinext/Vite、Cloudflare Workers、D1 与 Drizzle ORM，基于 Sites/Vinext starter 的框架和托管集成构建。

网页 `/api/*` 和代理 `/mcp` 共用 [`lib/jobs.ts`](lib/jobs.ts) 的业务逻辑。Sites 管理 ChatGPT 登录，数据库操作按用户 ID 限定；浏览器写请求检查来源和 JSON 内容类型。更新通过版本条件检测并发冲突，输入和导入批次经过校验，CSV 对常见公式前缀进行处理。中英两种语言共用稳定的 API 状态值，产品日期按 `America/Toronto` 时区处理。

完整的架构说明和代码入口见[主 README 的中文部分](README.md#chinese)。

## 本地运行与验证

需要 Node.js 22.13 或更新版本。

```sh
npm ci
npm run build
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mysterious_wrecking_crew.sql
npm run dev
```

构建会生成本地 Worker 配置，SQL 命令只用于首次初始化本地 D1 数据库。后续开发直接使用 `npm run dev`，结构变更需应用对应迁移。

打开终端显示的本地地址，开发预览可通过 `/signin-with-chatgpt?return_to=/` 模拟登录；生产登录由 Sites 管理。空数据版本可自行添加示例岗位或导入自己的 JSON 备份。

```sh
npm run check:types
npm run check:i18n
npm run build
```

`check:i18n` 覆盖日期、状态与优先级、服务端校验提示和初始渲染的语言回归检查。构建输出位于 `dist/`，`npm start` 启动本地生产 Worker 预览；模拟登录由开发服务器提供。修改结构后可用 `npm run db:generate` 生成迁移，仍需将迁移应用到对应数据库。

## 源码分发与部署

分发版本使用空的 [`lib/seed-jobs.json`](lib/seed-jobs.json)，不附带私人运行数据、数据库、备份、凭据或现有 Site 项目 ID。数据库结构与迁移文件不包含个人投递记录。

部署自己的副本时，按 Sites 流程注册独立 Site，将返回的项目 ID 写入 `.openai/hosting.json`；保留 `DB` 绑定和 `mcp` 能力声明，使用自己的部署身份与凭据，并同步部署对应的数据库迁移。

历史开发阶段和分发整理方式见 [`docs/source-history.md`](docs/source-history.md)。
