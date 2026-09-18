"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandLogo } from "@/components/branding/brand-logo";

export function AboutPage() {
  const content = useQuery(api.site.content, {});

  if (content === undefined) {
    return <main className="about-page"><section className="shell about-loading" aria-busy="true" aria-label="Loading our story"><span /><span /><span /></section></main>;
  }

  return (
    <main className="about-page">
      <section className="about-hero shell">
        <div className="about-hero-copy">
          <p className="eyebrow">{content.aboutEyebrow}</p>
          <h1>{content.aboutTitle}</h1>
          <p className="about-intro">{content.aboutIntro}</p>
          <Link className="button button-dark" href="/collections">Explore the collection <span aria-hidden="true">→</span></Link>
        </div>
        <div className="about-art" role="img" aria-label="The SM Sterling Mart HD logo on warm gold marble">
          <span className="about-art-line about-art-line-top" aria-hidden="true" />
          <span className="about-art-kicker">SM / 01</span>
          <BrandLogo className="about-art-logo" priority />
          <span className="about-art-caption">Jewelry lives forever</span>
          <span className="about-art-line about-art-line-bottom" aria-hidden="true" />
        </div>
      </section>

      <section className="about-story shell" aria-labelledby="about-story-heading">
        <div className="about-story-label"><p className="eyebrow">The story</p><span>01</span></div>
        <div className="about-story-copy"><h2 id="about-story-heading">A quieter kind of luxury.</h2><p>{content.aboutBody}</p><p className="about-signature">SterlingMart Atelier <span aria-hidden="true">✦</span></p></div>
      </section>

      <section className="about-values shell" aria-labelledby="about-values-heading">
        <div className="about-section-heading"><p className="eyebrow">What guides us</p><h2 id="about-values-heading">Chosen with intention.</h2></div>
        <div className="about-values-grid">{content.aboutValues.map((value, index) => <article className="about-value" key={value.title}><span className="about-value-number">0{index + 1}</span><h3>{value.title}</h3><p>{value.detail}</p></article>)}</div>
      </section>

      <section className="about-cta"><div className="shell about-cta-inner"><div><p className="eyebrow">Begin your edit</p><h2>Find the piece that becomes part of your story.</h2></div><Link className="button button-light" href="/contact">Speak with the salon <span aria-hidden="true">↗</span></Link></div></section>
    </main>
  );
}
