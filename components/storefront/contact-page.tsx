"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandLogo } from "@/components/branding/brand-logo";

const initialForm = { name: "", email: "", subject: "", message: "" };

export function ContactPage() {
  const content = useQuery(api.site.content, {});
  const submitMessage = useMutation(api.site.submitMessage);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (content === undefined) {
    return <main className="contact-page shell"><div className="contact-loading" aria-busy="true" aria-label="Loading contact details"><span /><span /></div></main>;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await submitMessage(form);
      setForm(initialForm);
      setStatus("sent");
    } catch (submitError) {
      setStatus("idle");
      setError(submitError instanceof Error ? submitError.message : "Your message could not be sent. Please try again.");
    }
  }

  return (
    <main className="contact-page shell">
      <section className="contact-heading" aria-labelledby="contact-heading">
        <div><p className="eyebrow">{content.contactEyebrow}</p><h1 id="contact-heading">{content.contactTitle}</h1><p>{content.contactIntro}</p></div>
        <span className="contact-heading-mark"><BrandLogo variant="mark" /></span>
      </section>
      <section className="contact-layout">
        <aside className="contact-details" aria-label="Contact details"><p className="contact-detail-kicker">Visit or write</p><div className="contact-detail-list"><div><span>Email</span><a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a></div><div><span>Phone</span><a href={`tel:${content.contactPhone.replace(/[^+\d]/g, "")}`}>{content.contactPhone}</a></div><div><span>Salon</span><p>{content.contactAddress}</p></div><div><span>Hours</span><p>{content.contactHours}</p></div></div><div className="contact-details-footer"><span aria-hidden="true">✦</span><p>Private appointments available by request.</p></div></aside>
        <div className="contact-form-card"><div className="contact-form-heading"><p className="eyebrow">Send a note</p><h2>We’re listening.</h2></div>{status === "sent" ? <div className="contact-success" role="status"><span aria-hidden="true">✓</span><h3>Thank you for writing.</h3><p>Your note is with the SterlingMart salon. We’ll be in touch soon.</p><button className="button button-dark" type="button" onClick={() => setStatus("idle")}>Send another note <span aria-hidden="true">↗</span></button></div> : <form className="contact-form" onSubmit={(event) => void handleSubmit(event)}><div className="contact-form-grid"><label><span>Name</span><input required maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label><label><span>Email</span><input required maxLength={160} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label><label className="contact-field-wide"><span>Subject</span><input required maxLength={160} value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="How can we help?" /></label><label className="contact-field-wide"><span>Message</span><textarea required maxLength={2000} rows={6} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Tell us about the piece or moment you have in mind." /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="contact-form-actions"><p>We usually reply within one business day.</p><button className="button button-dark" disabled={status === "sending"} type="submit">{status === "sending" ? "Sending…" : "Send your note"} <span aria-hidden="true">↗</span></button></div></form>}</div>
      </section>
      <p className="contact-back"><Link href="/collections">Return to the collection <span aria-hidden="true">↗</span></Link></p>
    </main>
  );
}
