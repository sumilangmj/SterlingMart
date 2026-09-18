export default function DashboardLoading() {
  return (
    <main className="dashboard-route-loading shell" aria-busy="true" aria-label="Loading dashboard">
      <p className="dashboard-page-kicker">SterlingMart workspace</p>
      <h1>Preparing your dashboard</h1>
      <p className="dashboard-route-loading-copy">Loading your role-specific workspace and its live data.</p>
      <div className="workspace-loading-grid" aria-hidden="true"><span /><span /><span /><span /></div>
    </main>
  );
}
