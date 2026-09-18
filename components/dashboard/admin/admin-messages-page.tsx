"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

const statuses = ["new", "read", "replied", "archived"] as const;
type MessageStatus = (typeof statuses)[number];

export function AdminMessagesPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [status, setStatus] = useState<MessageStatus | "">("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const messages = useQuery(api.site.messages, canQueryProtectedData ? { status: status || undefined } : "skip");
  const updateStatus = useMutation(api.site.updateMessageStatus);
  const visibleMessages = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (messages ?? []).filter((message) => !needle || `${message.name} ${message.email} ${message.subject} ${message.message}`.toLowerCase().includes(needle));
  }, [messages, search]);

  if (!canQueryProtectedData || messages === undefined) return <WorkspaceLoadingState label="messages" />;

  async function changeStatus(messageId: Id<"contactMessages">, nextStatus: MessageStatus) {
    setBusy(String(messageId));
    setError(null);
    try { await updateStatus({ messageId, status: nextStatus }); } catch { setError("The message status could not be saved."); } finally { setBusy(null); }
  }

  return <section className="admin-section" aria-labelledby="admin-messages-heading"><AdminPageHeader eyebrow="Salon correspondence" title="Messages" description="Review contact notes from the salon and keep every conversation moving with a clear status." /><div className="admin-toolbar"><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search messages</span><input type="search" placeholder="Search name, email, or subject" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="admin-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as MessageStatus | "")}><option value="">All messages</option>{statuses.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></label><span className="admin-toolbar-count">{visibleMessages.length} note{visibleMessages.length === 1 ? "" : "s"}</span></div>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-table-card"><table className="admin-table admin-messages-table"><thead><tr><th scope="col">From</th><th scope="col">Subject</th><th scope="col">Message</th><th scope="col">Received</th><th scope="col">Status</th></tr></thead><tbody>{visibleMessages.length ? visibleMessages.map((message) => <tr key={message._id}><td><strong>{message.name}</strong><small>{message.email}</small></td><td>{message.subject}</td><td className="admin-message-preview">{message.message}</td><td>{formatDate(message.createdAt)}</td><td><select className={`admin-status admin-status-${message.status === "new" ? "pending" : message.status === "replied" ? "delivered" : message.status === "archived" ? "cancelled" : "confirmed"}`} aria-label={`Status for message from ${message.name}`} disabled={busy === String(message._id)} value={message.status} onChange={(event) => void changeStatus(message._id, event.target.value as MessageStatus)}>{statuses.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></td></tr>) : <tr><td colSpan={5}><span className="admin-empty">No messages match this view.</span></td></tr>}</tbody></table></div></section>;
}
