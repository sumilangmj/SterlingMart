/* The Capacitor bundle uses native WebView images; Next Image cannot run in this standalone entrypoint. */
/* eslint-disable @next/next/no-img-element */
import { useAuth, useClerk, useUser } from "@clerk/react";
import { useSignIn, useSignUp } from "@clerk/react/legacy";
import { useMutation, useQuery } from "convex/react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useCallback, useEffect, useState } from "react";

type Product = Doc<"products">;
type ProductId = Id<"products">;
type Screen = "home" | "shop" | "cart" | "account" | "detail" | "checkout" | "success" | "contact";
type Route = { screen: Screen; slug?: string; orderId?: string; totalCents?: number };
type GuestLine = { productId: ProductId; quantity: number; product: Pick<Product, "slug" | "name" | "category" | "imageUrl" | "priceCents"> };
type AuthMode = "sign-in" | "sign-up" | null;

const GUEST_CART_KEY = "sterlingmart-mobile-guest-cart";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(cents / 100);
}

function readGuestCart(): GuestLine[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((line): line is GuestLine => {
      if (!line || typeof line !== "object") return false;
      const candidate = line as Partial<GuestLine>;
      return typeof candidate.productId === "string" && typeof candidate.quantity === "number" && candidate.quantity > 0 && Boolean(candidate.product?.name);
    });
  } catch {
    return [];
  }
}

function routeFromHash(): Route {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash.startsWith("product/")) return { screen: "detail", slug: decodeURIComponent(hash.slice("product/".length)) };
  if (hash === "shop") return { screen: "shop" };
  if (hash === "cart") return { screen: "cart" };
  if (hash === "account") return { screen: "account" };
  if (hash === "contact") return { screen: "contact" };
  return { screen: "home" };
}

function Mark() {
  return <span className="mobile-mark" aria-hidden="true">SM</span>;
}

function Icon({ name }: { name: "home" | "search" | "bag" | "user" | "heart" | "arrow" | "close" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    heart: <path d="M20.8 8.8c0 5.6-8.8 10.2-8.8 10.2S3.2 14.4 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />,
    arrow: <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  };
  return <svg className="mobile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function ProductCard({ product, onOpen, onAdd }: { product: Product; onOpen: (product: Product) => void; onAdd: (product: Product) => void }) {
  return (
    <article className="mobile-product-card">
      <button className="mobile-product-image" type="button" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}>
        <img src={product.imageUrl} alt="" loading="lazy" />
        {product.stock !== undefined && product.stock <= 0 && <span className="mobile-sold-out">Sold out</span>}
      </button>
      <div className="mobile-product-meta">
        <div>
          <p className="mobile-product-category">{product.category}</p>
          <h3>{product.name}</h3>
          <p className="mobile-product-price">{formatPrice(product.priceCents)}</p>
        </div>
        <button className="mobile-add-button" type="button" onClick={() => onAdd(product)} disabled={product.stock === 0} aria-label={`Add ${product.name} to bag`}>+</button>
      </div>
    </article>
  );
}

function LoadingGrid() {
  return <div className="mobile-grid mobile-grid-loading" aria-busy="true" aria-label="Loading live catalog">{Array.from({ length: 4 }, (_, index) => <div className="mobile-skeleton" key={index} />)}</div>;
}

function DataMessage({ message, action }: { message: string; action?: React.ReactNode }) {
  return <div className="mobile-data-message"><p>{message}</p>{action}</div>;
}

function HomeScreen({ onNavigate, onOpen, onAdd }: { onNavigate: (screen: Screen) => void; onOpen: (product: Product) => void; onAdd: (product: Product) => void }) {
  const products = useQuery(api.products.catalog, { featured: true, inStock: true, sort: "featured" });
  return (
    <main className="mobile-content">
      <section className="mobile-hero">
        <div className="mobile-hero-copy">
          <p className="mobile-eyebrow">SterlingMart · modern heirlooms</p>
          <h1>Pieces with a longer view.</h1>
          <p className="mobile-lead">Fine jewelry chosen for the moments that become part of your story.</p>
          <button className="mobile-primary-button" type="button" onClick={() => onNavigate("shop")}>Explore the edit <Icon name="arrow" /></button>
        </div>
        <div className="mobile-hero-art"><Mark /><span>quiet brilliance</span><strong>SM</strong></div>
      </section>
      <section className="mobile-section mobile-section-tight" aria-labelledby="featured-heading">
        <div className="mobile-section-heading"><div><p className="mobile-eyebrow">The edit</p><h2 id="featured-heading">Featured now</h2></div><button className="mobile-text-button" type="button" onClick={() => onNavigate("shop")}>View all <Icon name="arrow" /></button></div>
        {products === undefined ? <LoadingGrid /> : products.length === 0 ? <DataMessage message="The live catalog is waiting for its first featured pieces." action={<button className="mobile-text-button" type="button" onClick={() => onNavigate("shop")}>Browse all products <Icon name="arrow" /></button>} /> : <div className="mobile-grid">{products.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} onOpen={onOpen} onAdd={onAdd} />)}</div>}
      </section>
      <section className="mobile-story-card"><p className="mobile-eyebrow">A considered collection</p><h2>Designed to live beyond a single occasion.</h2><button className="mobile-text-button" type="button" onClick={() => onNavigate("contact")}>Talk with our team <Icon name="arrow" /></button></section>
    </main>
  );
}

function ShopScreen({ onOpen, onAdd, search, setSearch, category, setCategory }: { onOpen: (product: Product) => void; onAdd: (product: Product) => void; search: string; setSearch: (value: string) => void; category: string; setCategory: (value: string) => void }) {
  const products = useQuery(api.products.catalog, { search: search.trim() || undefined, categories: category ? [category] : undefined, inStock: true, sort: "featured" });
  const categories = useQuery(api.products.categories, {});
  return (
    <main className="mobile-content mobile-page-content">
      <div className="mobile-page-heading"><p className="mobile-eyebrow">The live catalog</p><h1>Find your piece.</h1><p>Every result below is read from the active SterlingMart inventory.</p></div>
      <label className="mobile-search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jewelry, material, stone" aria-label="Search the catalog" /></label>
      <div className="mobile-filter-row" role="list" aria-label="Filter by category"><button className={!category ? "is-active" : ""} type="button" onClick={() => setCategory("")}>All</button>{categories?.map((item) => <button className={category === item ? "is-active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {products === undefined ? <LoadingGrid /> : products.length === 0 ? <DataMessage message="No live products match those filters." /> : <div className="mobile-grid">{products.map((product) => <ProductCard key={product._id} product={product} onOpen={onOpen} onAdd={onAdd} />)}</div>}
    </main>
  );
}

function DetailScreen({ product, onBack, onAdd, onToggleFavorite, isFavorite, isSignedIn, onSignIn }: { product: Product | null | undefined; onBack: () => void; onAdd: (product: Product) => void; onToggleFavorite: (product: Product) => void; isFavorite: boolean; isSignedIn: boolean; onSignIn: () => void }) {
  if (product === undefined) return <main className="mobile-content mobile-page-content"><LoadingGrid /></main>;
  if (!product) return <main className="mobile-content mobile-page-content"><DataMessage message="This live product is no longer available." action={<button className="mobile-text-button" type="button" onClick={onBack}>Back to the catalog <Icon name="arrow" /></button>} /></main>;
  return (
    <main className="mobile-content mobile-detail-page">
      <button className="mobile-back-button" type="button" onClick={onBack}>← Back to catalog</button>
      <div className="mobile-detail-image"><img src={product.imageUrl} alt={product.name} /></div>
      <div className="mobile-detail-copy"><div className="mobile-detail-heading"><div><p className="mobile-eyebrow">{product.category}{product.collection ? ` · ${product.collection}` : ""}</p><h1>{product.name}</h1></div><button className={`mobile-heart-button ${isFavorite ? "is-saved" : ""}`} type="button" onClick={() => isSignedIn ? onToggleFavorite(product) : onSignIn()} aria-label={isFavorite ? "Remove from saved pieces" : "Save this piece"}><Icon name="heart" /></button></div><p className="mobile-detail-price">{formatPrice(product.priceCents)}</p><p className="mobile-detail-description">{product.description}</p><div className="mobile-detail-facts">{product.material && <span><small>Material</small>{product.material}</span>}{product.gemstone && <span><small>Stone</small>{product.gemstone}</span>}{product.stock !== undefined && <span><small>Availability</small>{product.stock > 0 ? `${product.stock} available` : "Sold out"}</span>}</div><button className="mobile-primary-button mobile-wide-button" type="button" onClick={() => onAdd(product)} disabled={product.stock === 0}>Add to bag <Icon name="arrow" /></button></div>
    </main>
  );
}

function CartScreen({ items, itemCount, subtotalCents, isLoading, onQuantity, onRemove, onNavigate }: { items: Array<{ productId: ProductId; slug: string; name: string; imageUrl: string; priceCents: number; quantity: number; lineTotalCents: number }>; itemCount: number; subtotalCents: number; isLoading: boolean; onQuantity: (productId: ProductId, quantity: number) => void; onRemove: (productId: ProductId) => void; onNavigate: (screen: Screen) => void }) {
  if (isLoading) return <main className="mobile-content mobile-page-content"><LoadingGrid /></main>;
  return <main className="mobile-content mobile-page-content"><div className="mobile-page-heading"><p className="mobile-eyebrow">Your selection</p><h1>Your bag.</h1><p>{itemCount ? `${itemCount} ${itemCount === 1 ? "piece" : "pieces"} selected.` : "Your bag is ready for something considered."}</p></div>{items.length === 0 ? <DataMessage message="Your bag is empty. Add a live catalog piece to begin." action={<button className="mobile-primary-button" type="button" onClick={() => onNavigate("shop")}>Browse the edit <Icon name="arrow" /></button>} /> : <><div className="mobile-cart-list">{items.map((item) => <div className="mobile-cart-line" key={item.productId}><img src={item.imageUrl} alt="" /><div className="mobile-cart-line-copy"><strong>{item.name}</strong><span>{formatPrice(item.priceCents)}</span><div className="mobile-quantity"><button type="button" onClick={() => onQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => onQuantity(item.productId, item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</button><button className="mobile-remove" type="button" onClick={() => onRemove(item.productId)}>Remove</button></div></div><strong>{formatPrice(item.lineTotalCents)}</strong></div>)}</div><div className="mobile-summary"><span>Subtotal</span><strong>{formatPrice(subtotalCents)}</strong></div><button className="mobile-primary-button mobile-wide-button" type="button" onClick={() => onNavigate("checkout")}>Continue to checkout <Icon name="arrow" /></button></>}</main>;
}

function CheckoutScreen({ items, subtotalCents, isSignedIn, onSignIn, onPlaceOrder, isSubmitting, error }: { items: Array<{ productId: ProductId; name: string; quantity: number; lineTotalCents: number }>; subtotalCents: number; isSignedIn: boolean; onSignIn: () => void; onPlaceOrder: () => void; isSubmitting: boolean; error: string | null }) {
  return <main className="mobile-content mobile-page-content"><button className="mobile-back-button" type="button" onClick={() => window.history.back()}>← Back to bag</button><div className="mobile-page-heading"><p className="mobile-eyebrow">Secure order request</p><h1>One last look.</h1><p>Your order is validated against live inventory before it is created.</p></div><div className="mobile-checkout-list">{items.map((item) => <div key={item.productId}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(item.lineTotalCents)}</strong></div>)}<div className="mobile-checkout-total"><span>Subtotal</span><strong>{formatPrice(subtotalCents)}</strong></div></div>{error && <p className="mobile-error" role="alert">{error}</p>}{!isSignedIn ? <div className="mobile-auth-callout"><p>Sign in to place a real order and keep it connected to your customer account.</p><button className="mobile-primary-button mobile-wide-button" type="button" onClick={onSignIn}>Sign in to continue <Icon name="arrow" /></button></div> : <button className="mobile-primary-button mobile-wide-button" type="button" disabled={isSubmitting} onClick={onPlaceOrder}>{isSubmitting ? "Creating your order…" : "Place order request"} <Icon name="arrow" /></button>}</main>;
}

function authError(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === "object" && "errors" in reason) {
    const errors = (reason as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
    if (errors?.[0]) return errors[0].longMessage ?? errors[0].message ?? "Authentication failed.";
  }
  return "Authentication failed. Check your details and try again.";
}

function AuthForm({ mode, onClose, onSwitch }: { mode: "sign-in" | "sign-up"; onClose: () => void; onSwitch: (mode: "sign-in" | "sign-up") => void }) {
  const { setActive } = useClerk();
  const signInState = useSignIn();
  const signUpState = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "sign-in") {
        if (!signInState.isLoaded || !signInState.signIn) throw new Error("Authentication is still loading.");
        const result = await signInState.signIn.create({ strategy: "password", identifier: email.trim(), password });
        if (result.status !== "complete" || !result.createdSessionId) throw new Error("This account needs another verification step before it can sign in.");
        await setActive({ session: result.createdSessionId });
        onClose();
      } else {
        if (!signUpState.isLoaded || !signUpState.signUp) throw new Error("Authentication is still loading.");
        const result = await signUpState.signUp.create({ emailAddress: email.trim(), password });
        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          onClose();
        } else {
          await result.prepareEmailAddressVerification({ strategy: "email_code" });
          setNeedsCode(true);
        }
      }
    } catch (reason) {
      setError(authError(reason));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!signUpState.isLoaded || !signUpState.signUp) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signUpState.signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status !== "complete" || !result.createdSessionId) throw new Error("That verification code was not accepted.");
      await setActive({ session: result.createdSessionId });
      onClose();
    } catch (reason) {
      setError(authError(reason));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="mobile-custom-auth"><p className="mobile-eyebrow">SterlingMart account</p><h2>{mode === "sign-in" ? "Welcome back." : "Keep your edit close."}</h2><p className="mobile-auth-intro">{needsCode ? "Check your email for the verification code." : mode === "sign-in" ? "Use the email and password connected to your account." : "Create an account to save pieces and place orders."}</p>{needsCode ? <form className="mobile-form" onSubmit={verifyCode}><label>Email code<input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} /></label>{error && <p className="mobile-error" role="alert">{error}</p>}<button className="mobile-primary-button mobile-wide-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Verifying…" : "Verify email"} <Icon name="arrow" /></button></form> : <form className="mobile-form" onSubmit={submit}><label>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="mobile-error" role="alert">{error}</p>}<button className="mobile-primary-button mobile-wide-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Connecting…" : mode === "sign-in" ? "Sign in" : "Create account"} <Icon name="arrow" /></button></form>}<button className="mobile-auth-switch" type="button" onClick={() => onSwitch(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div>;
}

function AccountScreen({ isLoaded, isSignedIn, user, profile, orders, onAuth, onSignOut, onNavigate, onContact }: { isLoaded: boolean; isSignedIn: boolean; user: ReturnType<typeof useUser>["user"]; profile: Doc<"profiles"> | null | undefined; orders: Array<{ id: string; orderNumber: string; itemName: string; itemCount: number; amountCents: number; status: string; createdAt: number }> | undefined; onAuth: (mode: AuthMode) => void; onSignOut: () => void; onNavigate: (screen: Screen) => void; onContact: () => void }) {
  if (!isLoaded) return <main className="mobile-content mobile-page-content"><DataMessage message="Connecting to your account…" /></main>;
  if (!isSignedIn) return <main className="mobile-content mobile-page-content"><div className="mobile-account-hero"><Mark /><p className="mobile-eyebrow">Your SterlingMart account</p><h1>Keep your edit close.</h1><p>Save pieces, keep your order history, and move your bag between devices.</p><button className="mobile-primary-button mobile-wide-button" type="button" onClick={() => onAuth("sign-in")}>Sign in <Icon name="arrow" /></button><button className="mobile-secondary-button mobile-wide-button" type="button" onClick={() => onAuth("sign-up")}>Create account</button></div></main>;
  const name = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || profile?.displayName || "Shopper";
  return <main className="mobile-content mobile-page-content"><div className="mobile-account-heading"><div className="mobile-avatar">{name.slice(0, 1).toUpperCase()}</div><div><p className="mobile-eyebrow">Your account</p><h1>{name}</h1><p>{user?.primaryEmailAddress?.emailAddress}</p></div></div><div className="mobile-account-actions"><button type="button" onClick={() => onNavigate("shop")}>Shop the live catalog <Icon name="arrow" /></button><button type="button" onClick={onContact}>Contact the salon <Icon name="arrow" /></button><button type="button" onClick={onSignOut}>Sign out <Icon name="arrow" /></button></div><section className="mobile-account-section"><div className="mobile-section-heading"><div><p className="mobile-eyebrow">Live records</p><h2>Order history</h2></div></div>{profile === undefined || orders === undefined ? <DataMessage message="Loading your live order history…" /> : profile?.role !== "customer" ? <DataMessage message="Order history is available for customer accounts." /> : orders.length === 0 ? <DataMessage message="No orders have been created for this account yet." /> : <div className="mobile-order-list">{orders.map((order) => <div className="mobile-order-row" key={order.id}><div><strong>#{order.orderNumber}</strong><span>{order.itemName}{order.itemCount > 1 ? ` + ${order.itemCount - 1} more` : ""}</span></div><div><strong>{formatPrice(order.amountCents)}</strong><span className="mobile-order-status">{order.status}</span></div></div>)}</div>}</section></main>;
}

function ContactScreen({ onBack }: { onBack: () => void }) {
  const content = useQuery(api.site.content, {});
  const submitMessage = useMutation(api.site.submitMessage);
  const liveContent = content && content.updatedAt > 0 ? content : null;
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await submitMessage(form);
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't send your message.");
    }
  }
  if (sent) return <main className="mobile-content mobile-page-content"><DataMessage message="Your message is with the SterlingMart team." action={<button className="mobile-primary-button" type="button" onClick={onBack}>Return to shopping <Icon name="arrow" /></button>} /></main>;
  return <main className="mobile-content mobile-page-content"><button className="mobile-back-button" type="button" onClick={onBack}>← Back</button><div className="mobile-page-heading"><p className="mobile-eyebrow">{liveContent?.contactEyebrow ?? "The SterlingMart salon"}</p><h1>{liveContent?.contactTitle ?? "Let’s find your next heirloom."}</h1><p>{liveContent?.contactIntro ?? "Tell us what you’re looking for."}</p></div>{liveContent ? <div className="mobile-contact-details"><a href={`mailto:${liveContent.contactEmail}`}>{liveContent.contactEmail}</a><a href={`tel:${liveContent.contactPhone.replace(/[^+\d]/g, "")}`}>{liveContent.contactPhone}</a><span>{liveContent.contactHours}</span></div> : <DataMessage message="The salon has not published contact details yet. You can still send a message below." />}<form className="mobile-form" onSubmit={submit}><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Subject<input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label><label>Message<textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>{error && <p className="mobile-error" role="alert">{error}</p>}<button className="mobile-primary-button mobile-wide-button" type="submit">Send message <Icon name="arrow" /></button></form></main>;
}

export function MobileApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [route, setRoute] = useState<Route>(() => routeFromHash());
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [guestItems, setGuestItems] = useState<GuestLine[]>(() => readGuestCart());
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const remoteCart = useQuery(api.cart.get, isSignedIn ? {} : "skip");
  const profile = useQuery(api.profiles.current, isSignedIn ? {} : "skip");
  const orders = useQuery(api.customer.orders, profile?.role === "customer" ? { status: undefined } : "skip");
  const remoteFavorites = useQuery(api.favorites.list, isSignedIn ? {} : "skip");
  const favorites = remoteFavorites ?? [];
  const mergeGuest = useMutation(api.cart.mergeGuest);
  const addRemote = useMutation(api.cart.addItem);
  const setRemoteQuantity = useMutation(api.cart.setQuantity);
  const removeRemote = useMutation(api.cart.removeItem);
  const toggleFavorite = useMutation(api.favorites.toggle);
  const ensureProfile = useMutation(api.profiles.ensureCurrent);
  const createOrder = useMutation(api.orders.createPending);

  useEffect(() => {
    const onPopState = () => setRoute(routeFromHash());
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onPopState);
    return () => { window.removeEventListener("popstate", onPopState); window.removeEventListener("hashchange", onPopState); };
  }, []);

  useEffect(() => {
    if (!isSignedIn) window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestItems));
  }, [guestItems, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    void ensureProfile({}).catch((reason) => setActionError(reason instanceof Error ? reason.message : "Your account could not be prepared."));
  }, [ensureProfile, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || guestItems.length === 0) return;
    void mergeGuest({ items: guestItems.map(({ productId, quantity }) => ({ productId, quantity })) }).then(() => setGuestItems([])).catch((reason) => setActionError(reason instanceof Error ? reason.message : "Your guest bag could not be merged."));
  }, [guestItems, isSignedIn, mergeGuest]);

  const navigate = useCallback((screen: Screen, options: Omit<Route, "screen"> = {}) => {
    const next: Route = { screen, ...options };
    const hash = screen === "detail" && options.slug ? `#product/${encodeURIComponent(options.slug)}` : screen === "home" ? "#home" : `#${screen}`;
    window.history.pushState(next, "", hash);
    setRoute(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const detailProduct = useQuery(api.products.bySlug, route.screen === "detail" && route.slug ? { slug: route.slug } : "skip");
  const guestCartItems = guestItems.map((line) => ({ productId: line.productId, slug: line.product.slug, name: line.product.name, category: line.product.category, imageUrl: line.product.imageUrl, priceCents: line.product.priceCents, quantity: line.quantity, lineTotalCents: line.product.priceCents * line.quantity }));
  const items = isSignedIn ? (remoteCart?.items ?? []) : guestCartItems;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const cartLoading = Boolean(isSignedIn && remoteCart === undefined);

  async function addItem(product: Product) {
    setActionError(null);
    try {
      if (isSignedIn) await addRemote({ productId: product._id, quantity: 1 });
      else setGuestItems((current) => { const existing = current.find((line) => line.productId === product._id); return existing ? current.map((line) => line.productId === product._id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { productId: product._id, quantity: 1, product: { slug: product.slug, name: product.name, category: product.category, imageUrl: product.imageUrl, priceCents: product.priceCents } }]; });
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "That piece could not be added.");
    }
  }

  async function setQuantity(productId: ProductId, quantity: number) {
    setActionError(null);
    try {
      if (isSignedIn) await setRemoteQuantity({ productId, quantity });
      else setGuestItems((current) => current.map((line) => line.productId === productId ? { ...line, quantity } : line).filter((line) => line.quantity > 0));
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The bag could not be updated.");
    }
  }

  async function removeItem(productId: ProductId) {
    setActionError(null);
    try {
      if (isSignedIn) await removeRemote({ productId });
      else setGuestItems((current) => current.filter((line) => line.productId !== productId));
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The piece could not be removed.");
    }
  }

  async function saveFavorite(product: Product) {
    if (!isSignedIn) { setAuthMode("sign-in"); return; }
    try { await toggleFavorite({ productId: product._id }); } catch (reason) { setActionError(reason instanceof Error ? reason.message : "Your saved pieces could not be updated."); }
  }

  async function placeOrder() {
    setCheckoutError(null);
    setIsSubmitting(true);
    try { const result = await createOrder({}); navigate("success", { orderId: result.orderId, totalCents: result.subtotalCents }); } catch (reason) { setCheckoutError(reason instanceof Error ? reason.message : "The order could not be created. Your bag is still safe."); } finally { setIsSubmitting(false); }
  }

  const activeNav = route.screen === "detail" || route.screen === "shop" ? "shop" : route.screen === "cart" || route.screen === "checkout" || route.screen === "success" ? "cart" : route.screen === "account" ? "account" : "home";
  return <div className="mobile-app"><header className="mobile-header"><button className="mobile-wordmark" type="button" onClick={() => navigate("home")}><Mark /><span>STERLING MART</span></button><button className="mobile-header-action" type="button" onClick={() => navigate("account")} aria-label="Open account"><Icon name="user" />{isSignedIn && <span className="mobile-live-dot" />}</button></header>{actionError && <div className="mobile-toast" role="alert">{actionError}<button type="button" onClick={() => setActionError(null)} aria-label="Dismiss"><Icon name="close" /></button></div>}{route.screen === "home" && <HomeScreen onNavigate={(screen) => navigate(screen)} onOpen={(product) => navigate("detail", { slug: product.slug })} onAdd={addItem} />}{route.screen === "shop" && <ShopScreen onOpen={(product) => navigate("detail", { slug: product.slug })} onAdd={addItem} search={search} setSearch={setSearch} category={category} setCategory={setCategory} />}{route.screen === "detail" && <DetailScreen product={detailProduct} onBack={() => navigate("shop")} onAdd={addItem} onToggleFavorite={saveFavorite} isFavorite={Boolean(detailProduct && favorites.includes(detailProduct._id))} isSignedIn={Boolean(isSignedIn)} onSignIn={() => setAuthMode("sign-in")} />}{route.screen === "cart" && <CartScreen items={items} itemCount={itemCount} subtotalCents={subtotalCents} isLoading={cartLoading} onQuantity={setQuantity} onRemove={removeItem} onNavigate={(screen) => navigate(screen)} />}{route.screen === "checkout" && <CheckoutScreen items={items} subtotalCents={subtotalCents} isSignedIn={Boolean(isSignedIn)} onSignIn={() => setAuthMode("sign-in")} onPlaceOrder={placeOrder} isSubmitting={isSubmitting} error={checkoutError} />}{route.screen === "success" && <main className="mobile-content mobile-page-content mobile-success"><div className="mobile-success-mark">✓</div><p className="mobile-eyebrow">Order received</p><h1>It’s in your records.</h1><p>Your order is pending and visible to the SterlingMart team for the next fulfillment step.</p><div className="mobile-success-card"><span>Reference</span><strong>#{route.orderId?.slice(-8).toUpperCase()}</strong><span>Status</span><strong>Pending</strong><span>Subtotal</span><strong>{formatPrice(route.totalCents ?? 0)}</strong></div><button className="mobile-primary-button mobile-wide-button" type="button" onClick={() => navigate("account")}>View your account <Icon name="arrow" /></button></main>}{route.screen === "account" && <AccountScreen isLoaded={isLoaded} isSignedIn={Boolean(isSignedIn)} user={user} profile={profile} orders={orders} onAuth={setAuthMode} onSignOut={() => void signOut()} onNavigate={(screen) => navigate(screen)} onContact={() => navigate("contact")} />}{route.screen === "contact" && <ContactScreen onBack={() => navigate("home")} />}{!authMode && <nav className="mobile-tab-bar" aria-label="Primary navigation"><button className={activeNav === "home" ? "is-active" : ""} type="button" onClick={() => navigate("home")}><Icon name="home" /><span>Home</span></button><button className={activeNav === "shop" ? "is-active" : ""} type="button" onClick={() => navigate("shop")}><Icon name="search" /><span>Shop</span></button><button className={activeNav === "cart" ? "is-active" : ""} type="button" onClick={() => navigate("cart")}><span className="mobile-bag-icon"><Icon name="bag" />{itemCount > 0 && <b>{itemCount > 99 ? "99+" : itemCount}</b>}</span><span>Bag</span></button><button className={activeNav === "account" ? "is-active" : ""} type="button" onClick={() => navigate("account")}><Icon name="user" /><span>Account</span></button></nav>}{authMode && <div className="mobile-auth-overlay" role="dialog" aria-modal="true"><div className="mobile-auth-sheet"><button className="mobile-auth-close" type="button" onClick={() => setAuthMode(null)} aria-label="Close authentication"><Icon name="close" /></button><AuthForm mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} /></div></div>}</div>;
}
