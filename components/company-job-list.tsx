"use client";

import { ArrowUpRight, CalendarDays, ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { CompanyGroup } from "../lib/company-groups";
import type { Job } from "../lib/job-types";

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
  return <div className="company-list">{groups.map(group => {
    const total = totals.get(group.key)?.jobs.length ?? group.jobs.length;
    const multiple = group.jobs.length > 1;
    const open = multiple && expanded.has(group.key);
    const regionId = `company-roles-${encodeURIComponent(group.key)}`;
    const preview = [...new Set(group.jobs.map(job => job.title))].slice(0, 2).join(" · ");
    return <section className={`company-entry ${open ? "company-entry-open" : ""}`} key={group.key} aria-label={`${group.name}，${group.jobs.length} 个匹配岗位`}>
      <div className="company-entry-heading">
        <button className="company-entry-toggle" aria-expanded={multiple ? open : undefined} aria-controls={multiple ? regionId : undefined} aria-label={multiple ? `${open ? "收起" : "展开"} ${group.name} 的 ${group.jobs.length} 个岗位` : `查看 ${group.name} 的 ${group.jobs[0].title}`} onClick={() => multiple ? onToggle(group.key) : onOpen(group.jobs[0])}>
          <span className={`company-avatar company-${group.name.length % 4}`}>{group.name.slice(0, 1).toUpperCase()}</span>
          <span className="company-entry-identity"><span className="company-name-line"><strong>{group.name}</strong><span className="company-role-count">{group.jobs.length === total ? `${total} 个岗位` : `${group.jobs.length} / ${total} 个岗位`}</span></span><span className="company-role-preview">{preview}</span></span>
          {multiple ? <ChevronRight className={open ? "company-chevron is-open" : "company-chevron"} size={17} /> : <ArrowUpRight className="company-chevron" size={16} />}
        </button>
        {!archived && <button className="company-add" onClick={() => onAdd(group.name)} aria-label={`为 ${group.name} 新增岗位`} title="新增这家公司的岗位"><Plus size={15} /><span>新增岗位</span></button>}
      </div>
      <div className="company-entry-meta"><div className="company-stage-summary">
        {group.pendingCount > 0 && <span>待投递 <b>{group.pendingCount}</b></span>}
        {group.appliedCount > 0 && <span className="company-stage-applied">已投递 <b>{group.appliedCount}</b></span>}
        {group.interviewCount > 0 && <span className="company-stage-interview">面试中 <b>{group.interviewCount}</b></span>}
        {!group.pendingCount && !group.appliedCount && <span>{archived ? "已归档" : "已结束"} <b>{group.jobs.length}</b></span>}
        {group.dueCount > 0 && <span className="company-stage-due">待跟进 <b>{group.dueCount}</b></span>}
      </div>{group.nextFollowUpDate && <span className={`company-next-date ${group.nextFollowUpDate < today ? "is-overdue" : ""}`}><CalendarDays size={12} />{group.nextFollowUpDate < today ? "逾期 " : group.nextFollowUpDate === today ? "今天 " : "下次跟进 "}{group.nextFollowUpDate}</span>}</div>
      {total > group.jobs.length && <button className="company-show-all" onClick={() => onShowCompany(group.key)}>查看该公司全部 {total} 个{archived ? "归档" : ""}岗位<ArrowUpRight size={12} /></button>}
      {open && <div id={regionId} className="company-expanded-jobs" role="region" aria-label={`${group.name} 的岗位列表`}>{group.jobs.map(renderJob)}</div>}
    </section>;
  })}</div>;
}
