"use client";

import { ArrowUpRight, CalendarDays, ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { CompanyGroup } from "../lib/company-groups";
import type { Job } from "../lib/job-types";
import { useI18n } from "../lib/i18n";

type Props = {
  groups: CompanyGroup[];
  totals: Map<string, CompanyGroup>;
  expanded: Set<string>;
  today: string;
  onToggle: (key: string) => void;
  onOpen: (job: Job) => void;
  onAdd: (company: string) => void;
  onShowCompany: (key: string) => void;
  renderJob: (job: Job) => ReactNode;
  archived?: boolean;
};

export default function CompanyJobList({ groups, totals, expanded, today, onToggle, onOpen, onAdd, onShowCompany, renderJob, archived = false }: Props) {
  const { t, shortDate } = useI18n();
  return <div className="company-list">{groups.map(group => {
    const total = totals.get(group.key)?.jobs.length ?? group.jobs.length;
    const multiple = group.jobs.length > 1;
    const open = multiple && expanded.has(group.key);
    const regionId = `company-roles-${encodeURIComponent(group.key)}`;
    const preview = [...new Set(group.jobs.map(job => job.title))].slice(0, 2).join(" · ");
    return <section className={`company-entry ${open ? "company-entry-open" : ""}`} key={group.key} aria-label={t(`${group.name}，${group.jobs.length} 个匹配岗位`, `${group.name}, ${group.jobs.length} matching ${group.jobs.length === 1 ? "role" : "roles"}`)}>
      <div className="company-entry-heading">
        <button className="company-entry-toggle" aria-expanded={multiple ? open : undefined} aria-controls={multiple ? regionId : undefined} aria-label={multiple ? t(`${open ? "收起" : "展开"} ${group.name} 的 ${group.jobs.length} 个岗位`, `${open ? "Collapse" : "Expand"} ${group.jobs.length} roles at ${group.name}`) : t(`查看 ${group.name} 的 ${group.jobs[0].title}`, `View ${group.jobs[0].title} at ${group.name}`)} onClick={() => multiple ? onToggle(group.key) : onOpen(group.jobs[0])}>
          <span className={`company-avatar company-${group.name.length % 4}`}>{group.name.slice(0, 1).toUpperCase()}</span>
          <span className="company-entry-identity"><span className="company-name-line"><strong>{group.name}</strong><span className="company-role-count">{group.jobs.length === total ? t(`${total} 个岗位`, `${total} ${total === 1 ? "role" : "roles"}`) : t(`${group.jobs.length} / ${total} 个岗位`, `${group.jobs.length} / ${total} roles`)}</span></span><span className="company-role-preview">{preview}</span></span>
          {multiple ? <ChevronRight className={open ? "company-chevron is-open" : "company-chevron"} size={17} /> : <ArrowUpRight className="company-chevron" size={16} />}
        </button>
        {!archived && <button className="company-add" onClick={() => onAdd(group.name)} aria-label={t(`为 ${group.name} 新增岗位`, `Add a role at ${group.name}`)} title={t("新增这家公司的岗位", "Add a role at this company")}><Plus size={15} /><span>{t("新增岗位", "Add role")}</span></button>}
      </div>
      <div className="company-entry-meta"><div className="company-stage-summary">
        {group.pendingCount > 0 && <span>{t("待投递", "To apply")} <b>{group.pendingCount}</b></span>}
        {group.appliedCount > 0 && <span className="company-stage-applied">{t("已投递", "Applied")} <b>{group.appliedCount}</b></span>}
        {group.interviewCount > 0 && <span className="company-stage-interview">{t("面试中", "Interviewing")} <b>{group.interviewCount}</b></span>}
        {!group.pendingCount && !group.appliedCount && <span>{archived ? t("已归档", "Archived") : t("已结束", "Closed")} <b>{group.jobs.length}</b></span>}
        {group.dueCount > 0 && <span className="company-stage-due">{t("待跟进", "Follow-ups due")} <b>{group.dueCount}</b></span>}
      </div>{group.nextFollowUpDate && <span className={`company-next-date ${group.nextFollowUpDate < today ? "is-overdue" : ""}`}><CalendarDays size={12} />{group.nextFollowUpDate < today ? t("逾期 ", "Overdue ") : group.nextFollowUpDate === today ? t("今天 ", "Today ") : t("下次跟进 ", "Next follow-up ")}{shortDate(group.nextFollowUpDate)}</span>}</div>
      {total > group.jobs.length && <button className="company-show-all" onClick={() => onShowCompany(group.key)}>{archived ? t(`查看该公司全部 ${total} 个归档岗位`, `View all ${total} archived roles at this company`) : t(`查看该公司全部 ${total} 个岗位`, `View all ${total} roles at this company`)}<ArrowUpRight size={12} /></button>}
      {open && <div id={regionId} className="company-expanded-jobs" role="region" aria-label={t(`${group.name} 的岗位列表`, `Roles at ${group.name}`)}>{group.jobs.map(renderJob)}</div>}
    </section>;
  })}</div>;
}
