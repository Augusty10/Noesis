import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <SignIn fallbackRedirectUrl="/notebooks" signUpUrl="/sign-up" />
    </div>
  );
}
