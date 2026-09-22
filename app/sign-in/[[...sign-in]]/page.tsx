import { SignIn } from "@clerk/nextjs";
import { BrandLogo } from "@/components/branding/brand-logo";

export default function SignInPage() {
  return (
    <div className="auth-page shell" data-scroll-reveal="auth">
      <div>
        <BrandLogo className="auth-brand-logo" priority />
        <p className="eyebrow">Welcome back</p>
        <h1>Come on in.</h1>
        <p className="auth-intro">Your considered collection is waiting.</p>
      </div>
      <SignIn forceRedirectUrl="/dashboard" />
    </div>
  );
}
