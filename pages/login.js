import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { useCookies } from "react-cookie";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [, setCookie] = useCookies(["auth_token"]);

  // Check for error in URL params
  const urlError = router.query.error;

  const handleSuccess = async (credentialResponse) => {
    setError(null);
    // credentialResponse.credential is the JWT (ID token)
    const { data, error: apiError } = await api.googleLogin(credentialResponse.credential);

    if (apiError) {
      setError(apiError.message || "Login failed. Please try again.");
      return;
    }

    // Store the auth token in cookie (API returns access_token)
    if (data.access_token) {
      setCookie("auth_token", data.access_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    // Redirect to dashboard
    router.push("/a/dashboard");
  };

  const handleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-129px)] w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <p className="inline-flex rounded-md border border-[#3c3c3c] bg-[#252526] px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[#9cdcfe]">
            Welcome back
          </p>

          <h1 className="mt-6 max-w-xl font-[var(--font-heading)] text-5xl leading-[1.05] text-[#f3f3f3]">
            Sign in and continue building your future.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-[#b4b4b4]">
            Keep your daily log, job hunting tracker, and my journal in one focused workspace.
          </p>

          <div className="mt-8 space-y-3">
            <div className="rounded-lg border border-[#3c3c3c] bg-[#252526] px-4 py-3 text-sm text-[#c8c8c8]">
              Daily progress you can look back on
            </div>
            <div className="rounded-lg border border-[#3c3c3c] bg-[#252526] px-4 py-3 text-sm text-[#c8c8c8]">
              Cleaner career tracking and follow-ups
            </div>
            <div className="rounded-lg border border-[#3c3c3c] bg-[#252526] px-4 py-3 text-sm text-[#c8c8c8]">
              Faith-centered reflection with intention
            </div>
          </div>
        </section>

        <Card className="w-full max-w-md justify-self-center rounded-xl border-[#3c3c3c] bg-[#252526] py-0 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-[#3c3c3c] px-6 py-6">
            <CardTitle className="font-[var(--font-heading)] text-3xl text-[#f3f3f3]">Welcome back</CardTitle>
            <CardDescription className="text-sm leading-6 text-[#9da1a6]">
              Sign in with Google to continue your personal dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6 py-6">
            {(error || urlError) && (
              <div className="rounded-md border border-[#5a1d1d] bg-[#3a1717] px-3 py-2 text-sm text-[#f48771]">
                {error || urlError}
              </div>
            )}

            <div className="flex justify-center rounded-md border border-[#3c3c3c] bg-[#1f1f1f] px-3 py-4">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap
                theme="filled_black"
                size="large"
                width="320"
                text="continue_with"
                shape="rectangular"
              />
            </div>

            <p className="text-xs leading-5 text-[#9da1a6]">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-[#9cdcfe] hover:text-[#c5e7ff]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#9cdcfe] hover:text-[#c5e7ff]">
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>

    </div>
  );
}
