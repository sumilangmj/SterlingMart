import Link from "next/link";
import type { ReactNode } from "react";

export function RoleStatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) {
  return (
    <article className="role-stat-card">
      <span className="role-stat-icon" aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

export function RolePanel({ eyebrow, title, action, children, className = "" }: { eyebrow?: string; title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`role-panel ${className}`.trim()}>
      <header className="role-panel-heading">
        <div>
          {eyebrow && <p className="role-panel-eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      <div className="role-panel-body">{children}</div>
    </section>
  );
}

export function RoleStatus({ status }: { status: string }) {
  return <span className={`role-status role-status-${status.replaceAll("_", "-")}`}>{status.replaceAll("_", " ")}</span>;
}

export function RoleOverviewLoading({ label }: { label: string }) {
  return (
    <div className="role-overview-loading" aria-busy="true" aria-label={`Loading ${label} dashboard`}>
      <span className="role-loading-hero" />
      <div className="role-loading-stats"><span /><span /><span /><span /></div>
      <div className="role-loading-panels"><span /><span /><span /></div>
    </div>
  );
}

export function DashboardLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="role-panel-link" href={href}>{children}<span aria-hidden="true">↗</span></Link>;
}
