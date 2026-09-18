import { SignUp } from "@clerk/nextjs";
import { BrandLogo } from "@/components/branding/brand-logo";

export default function SignUpPage() {
  return (
    <div className="auth-page shell">
      <div>
        <BrandLogo className="auth-brand-logo" priority />
        <p className="eyebrow">Join SterlingMart</p>
        <h1>Make room for what lasts.</h1>
        <p className="auth-intro">Create an account to save your edit, keep your cart, and follow every order.</p>
      </div>
      <SignUp forceRedirectUrl="/dashboard" />
    </div>
  );
}
