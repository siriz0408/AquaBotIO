"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fish, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type ConfirmStatus = "loading" | "success" | "error" | "expired";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      // If no token, check if user is already confirmed
      if (!token_hash) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage("No confirmation token found. Please check your email for the confirmation link.");
        }
        return;
      }

      // Verify the token
      if (type === "email" || type === "signup") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "email",
        });

        if (error) {
          if (error.message.includes("expired")) {
            setStatus("expired");
          } else {
            setStatus("error");
            setErrorMessage(error.message);
          }
        } else {
          setStatus("success");
        }
      } else {
        setStatus("error");
        setErrorMessage("Invalid confirmation type");
      }
    };

    confirmEmail();
  }, [searchParams, supabase.auth]);

  const handleResendConfirmation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (!error) {
        setErrorMessage("A new confirmation email has been sent. Please check your inbox.");
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
          <Fish className="h-8 w-8 text-brand-cyan" />
          <span className="text-xl font-bold">AquaBotAI</span>
        </Link>

        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            </div>
            <CardTitle>Confirming your email...</CardTitle>
            <CardDescription>Please wait while we verify your email address</CardDescription>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Email confirmed!</CardTitle>
            <CardDescription>Your email has been verified successfully</CardDescription>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Confirmation failed</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Mail className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>Link expired</CardTitle>
            <CardDescription>This confirmation link has expired. Please request a new one.</CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {status === "success" && (
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        )}

        {(status === "error" || status === "expired") && (
          <>
            {status === "expired" && (
              <Button onClick={handleResendConfirmation} className="w-full">
                Resend Confirmation Email
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            </CardContent>
          </Card>
        }
      >
        <ConfirmContent />
      </Suspense>
    </div>
  );
}
