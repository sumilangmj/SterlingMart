import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell page-section empty-page" data-scroll-reveal="not-found" aria-labelledby="not-found-heading">
      <p className="eyebrow">Not found</p>
      <h1 id="not-found-heading">That page has moved on.</h1>
      <p>Try the collection instead.</p>
      <Link className="button button-dark" href="/">Back to SterlingMart <span aria-hidden="true">→</span></Link>
    </section>
  );
}
