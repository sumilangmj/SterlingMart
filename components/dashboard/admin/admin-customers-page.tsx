"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Role } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

const roleOptions: Role[] = ["customer", "staff", "vendor", "admin"];

export function AdminCustomersPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [search, setSearch] = useState("");
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const customers = useQuery(api.admin.customers, canQueryProtectedData ? {} : "skip");
  const setRole = useMutation(api.profiles.setRole);
  const visibleCustomers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (customers ?? []).filter((customer) => !needle || `${customer.name} ${customer.email} ${customer.role}`.toLowerCase().includes(needle));
  }, [customers, search]);

  if (!canQueryProtectedData || customers === undefined) return <WorkspaceLoadingState label="customers" />;

  async function changeRole(userId: string, role: Role) {
    setBusyUser(userId);
    setError(null);
    try {
      await setRole({ userId, role });
    } catch {
      setError("That role change could not be saved.");
    } finally {
      setBusyUser(null);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-customers-heading">
      <AdminPageHeader eyebrow="Customer circle" title="Customers" description="See account activity at a glance and keep access aligned with every team member’s role." />
      <div className="admin-toolbar"><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search customers</span><input type="search" placeholder="Search names, emails, or roles" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="admin-toolbar-count">{visibleCustomers.length} profile{visibleCustomers.length === 1 ? "" : "s"}</span></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-table-card"><table className="admin-table"><thead><tr><th scope="col">Profile</th><th scope="col">Role</th><th scope="col">Orders</th><th scope="col">Spend</th><th scope="col">Saved pieces</th><th scope="col">Joined</th></tr></thead><tbody>{visibleCustomers.length ? visibleCustomers.map((customer) => <tr key={customer.id}><td><strong>{customer.name || "Sterling customer"}</strong><small>{customer.email}</small></td><td><select className="admin-role-select" aria-label={`Role for ${customer.name || customer.email}`} disabled={busyUser === customer.userId} value={customer.role} onChange={(event) => void changeRole(customer.userId, event.target.value as Role)}>{roleOptions.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}</select></td><td>{customer.orderCount}</td><td>{formatPrice(customer.spendCents)}</td><td>{customer.savedPieces}</td><td>{formatDate(customer.joinedAt, { month: "short", year: "numeric" })}</td></tr>) : <tr><td colSpan={6}><span className="admin-empty">No customer profiles match this view.</span></td></tr>}</tbody></table></div>
    </section>
  );
}
