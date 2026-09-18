export function WorkspaceLoadingState({ label }: { label: string }) {
  return (
    <section className="admin-section" aria-labelledby="workspace-loading-heading">
      <div className="admin-page-header">
        <div>
          <p className="dashboard-page-kicker">SterlingMart workspace</p>
          <h2 id="workspace-loading-heading">Loading {label}</h2>
          <p>Bringing the latest workspace data into view.</p>
        </div>
      </div>
      <div className="workspace-loading-grid" aria-busy="true" aria-label={`Loading ${label}`}>
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

export function DashboardOverviewLoading() {
  return (
    <div className="dashboard-overview" aria-busy="true" aria-label="Loading dashboard overview">
      <div className="dashboard-loading-kpis">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="dashboard-loading-panels">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
