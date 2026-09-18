"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

export function AdminSiteContentPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const content = useQuery(api.site.content, canQueryProtectedData ? {} : "skip");
  const saveContent = useMutation(api.site.saveContent);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!canQueryProtectedData || content === undefined) return <WorkspaceLoadingState label="site content" />;
  const currentContent = content;

  const value = (field: string) => form[field] ?? String(content[field as keyof typeof content] ?? "");
  const update = (field: string, next: string) => setForm((current) => ({ ...current, [field]: next }));
  async function submit() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await saveContent({
        aboutEyebrow: value("aboutEyebrow"), aboutTitle: value("aboutTitle"), aboutIntro: value("aboutIntro"), aboutBody: value("aboutBody"), aboutValues: currentContent.aboutValues,
        contactEyebrow: value("contactEyebrow"), contactTitle: value("contactTitle"), contactIntro: value("contactIntro"), contactEmail: value("contactEmail"), contactPhone: value("contactPhone"), contactAddress: value("contactAddress"), contactHours: value("contactHours"),
      });
      setMessage("Public brand and salon content saved.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "The site content could not be saved."); } finally { setBusy(false); }
  }

  return <section className="admin-section" aria-labelledby="admin-site-content-heading"><AdminPageHeader eyebrow="Brand system" title="Site content" description="Keep the public About and Contact pages aligned with the same considered voice as the dashboard." />{message && <p className="admin-success" role="status">{message}</p>}{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-content-editor-grid"><article className="admin-settings-card"><p className="admin-card-kicker">About us</p><h3>The story customers meet</h3><div className="admin-form-grid admin-content-form-grid"><label className="admin-form-field"><span>Eyebrow</span><input value={value("aboutEyebrow")} onChange={(event) => update("aboutEyebrow", event.target.value)} /></label><label className="admin-form-field admin-form-field-wide"><span>Title</span><input value={value("aboutTitle")} onChange={(event) => update("aboutTitle", event.target.value)} /></label><label className="admin-form-field admin-form-field-wide"><span>Introduction</span><textarea rows={3} value={value("aboutIntro")} onChange={(event) => update("aboutIntro", event.target.value)} /></label><label className="admin-form-field admin-form-field-wide"><span>Story</span><textarea rows={7} value={value("aboutBody")} onChange={(event) => update("aboutBody", event.target.value)} /></label></div></article><article className="admin-settings-card"><p className="admin-card-kicker">Contact</p><h3>The salon details</h3><div className="admin-form-grid admin-content-form-grid"><label className="admin-form-field"><span>Eyebrow</span><input value={value("contactEyebrow")} onChange={(event) => update("contactEyebrow", event.target.value)} /></label><label className="admin-form-field admin-form-field-wide"><span>Title</span><input value={value("contactTitle")} onChange={(event) => update("contactTitle", event.target.value)} /></label><label className="admin-form-field admin-form-field-wide"><span>Introduction</span><textarea rows={3} value={value("contactIntro")} onChange={(event) => update("contactIntro", event.target.value)} /></label><label className="admin-form-field"><span>Email</span><input type="email" value={value("contactEmail")} onChange={(event) => update("contactEmail", event.target.value)} /></label><label className="admin-form-field"><span>Phone</span><input value={value("contactPhone")} onChange={(event) => update("contactPhone", event.target.value)} /></label><label className="admin-form-field admin-form-field-wide"><span>Salon address</span><input value={value("contactAddress")} onChange={(event) => update("contactAddress", event.target.value)} /></label><label className="admin-form-field admin-form-field-wide"><span>Hours</span><input value={value("contactHours")} onChange={(event) => update("contactHours", event.target.value)} /></label></div></article></div><div className="admin-content-editor-actions"><p>Brand values remain a curated three-part system so the About page keeps its rhythm.</p><button className="admin-button" disabled={busy} type="button" onClick={() => void submit()}>{busy ? "Saving…" : "Save public content"} <span aria-hidden="true">↗</span></button></div></section>;
}
