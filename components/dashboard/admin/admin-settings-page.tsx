"use client";

import { type FormEvent, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Role } from "@/lib/types";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

const roles: Role[] = ["customer", "staff", "vendor", "admin"];

export function AdminSettingsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const customers = useQuery(api.admin.customers, canQueryProtectedData ? {} : "skip");
  const workspace = useQuery(api.settings.workspace, canQueryProtectedData ? {} : "skip");
  const setRole = useMutation(api.profiles.setRole);
  const saveWorkspace = useMutation(api.settings.saveWorkspace);
  const [workspaceForm, setWorkspaceForm] = useState({ storeName: "", supportEmail: "", adminEmail: "", currency: "", lowStockThreshold: "" });

  if (!canQueryProtectedData || customers === undefined || workspace === undefined) return <WorkspaceLoadingState label="settings" />;

  async function changeRole(userId: string, role: Role) {
    setBusyUser(userId);
    setMessage(null);
    setError(null);
    try {
      await setRole({ userId, role });
      setMessage("Role access updated. The next dashboard request will use the new permission.");
    } catch {
      setError("The role could not be updated. The current administrator cannot remove the final admin access.");
    } finally {
      setBusyUser(null);
    }
  }

  async function saveStoreSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await saveWorkspace({ storeName: workspaceForm.storeName || workspace?.storeName || "SM Sterling Mart", supportEmail: workspaceForm.supportEmail || workspace?.supportEmail || "hello@sterlingmart.com", adminEmail: workspaceForm.adminEmail || workspace?.adminEmail || "sumilangmj@gmail.com", currency: workspaceForm.currency || workspace?.currency || "USD", lowStockThreshold: Number(workspaceForm.lowStockThreshold || workspace?.lowStockThreshold || 12) });
      setMessage("Store settings saved to the workspace configuration.");
    } catch {
      setError("The store settings could not be saved.");
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-settings-heading">
      <AdminPageHeader eyebrow="Workspace governance" title="Settings" description="Review connected services and control which dashboard each account can access." />
      {message && <p className="admin-success" role="status">{message}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-settings-grid"><article className="admin-settings-card"><p className="admin-card-kicker">Connected services</p><h3>System foundation</h3><div className="admin-integration"><span className="admin-integration-mark">C</span><div><strong>Clerk</strong><small>Identity, sessions, and account security</small></div><b>Connected</b></div><div className="admin-integration"><span className="admin-integration-mark">V</span><div><strong>Convex</strong><small>Roles, catalog, cart, orders, and analytics</small></div><b>Connected</b></div><div className="admin-integration"><span className="admin-integration-mark">GH</span><div><strong>GitHub</strong><small>Source repository and collaboration</small></div><b>Connected</b></div></article><article className="admin-settings-card"><p className="admin-card-kicker">Store configuration</p><h3>Workspace defaults</h3><form className="admin-settings-form" onSubmit={(event) => void saveStoreSettings(event)}><div className="admin-form-grid"><label className="admin-form-field"><span>Store name</span><input required value={workspaceForm.storeName || workspace?.storeName || "SM Sterling Mart"} onChange={(event) => setWorkspaceForm((current) => ({ ...current, storeName: event.target.value }))} /></label><label className="admin-form-field"><span>Currency</span><input required value={workspaceForm.currency || workspace?.currency || "USD"} onChange={(event) => setWorkspaceForm((current) => ({ ...current, currency: event.target.value }))} /></label><label className="admin-form-field"><span>Support email</span><input required type="email" value={workspaceForm.supportEmail || workspace?.supportEmail || "hello@sterlingmart.com"} onChange={(event) => setWorkspaceForm((current) => ({ ...current, supportEmail: event.target.value }))} /></label><label className="admin-form-field"><span>Admin email</span><input required type="email" value={workspaceForm.adminEmail || workspace?.adminEmail || "sumilangmj@gmail.com"} onChange={(event) => setWorkspaceForm((current) => ({ ...current, adminEmail: event.target.value }))} /></label><label className="admin-form-field"><span>Low-stock threshold</span><input required min="0" step="1" type="number" value={workspaceForm.lowStockThreshold || workspace?.lowStockThreshold || 12} onChange={(event) => setWorkspaceForm((current) => ({ ...current, lowStockThreshold: event.target.value }))} /></label></div><button className="admin-button" type="submit">Save workspace defaults</button></form></article><article className="admin-settings-card"><p className="admin-card-kicker">Access policy</p><h3>Role capabilities</h3><div className="admin-role-matrix"><div><span>Customer</span><small>Storefront, cart, checkout, saved pieces</small></div><div><span>Staff</span><small>Orders, customer activity, operations</small></div><div><span>Vendor</span><small>Products, stock, signature placements</small></div><div><span>Admin</span><small>Full commerce workspace and role access</small></div></div><p className="admin-settings-note">Default role: customer · Initial administrator: sumilangmj@gmail.com</p></article></div>
      <article className="admin-settings-card admin-role-card"><div className="admin-card-heading"><div><p className="admin-card-kicker">People & permissions</p><h3>Account roles</h3></div><span>{customers?.length ?? 0} profiles</span></div><div className="admin-role-list">{customers?.length ? customers.map((customer) => <div className="admin-role-row" key={customer.id}><div><strong>{customer.name || "Sterling customer"}</strong><small>{customer.email}</small></div><select className="admin-role-select" aria-label={`Role for ${customer.name || customer.email}`} disabled={busyUser === customer.userId} value={customer.role} onChange={(event) => void changeRole(customer.userId, event.target.value as Role)}>{roles.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}</select></div>) : <p className="admin-empty">Profiles will appear after accounts sign in.</p>}</div></article>
    </section>
  );
}
