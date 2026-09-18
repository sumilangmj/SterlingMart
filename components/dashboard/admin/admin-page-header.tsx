import type { ReactNode } from "react";

export function AdminPageHeader({ eyebrow, title, description, action, id }: { eyebrow: string; title: string; description: string; action?: ReactNode; id?: string }) {
  const headingId = id ?? `admin-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`;
  return (
    <div className="admin-page-header">
      <div><p className="dashboard-page-kicker">{eyebrow}</p><h2 id={headingId}>{title}</h2><p>{description}</p></div>
      {action && <div className="admin-page-header-action">{action}</div>}
    </div>
  );
}
