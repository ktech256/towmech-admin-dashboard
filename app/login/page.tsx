"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login, verifyOtp } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState<"login" | "otp">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email, password });
      setStep("otp");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Login failed. Please check credentials or try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await verifyOtp({ email, otp });

      const token = data?.token;
      const user = data?.user;

      if (!token || !user) {
        throw new Error("Invalid auth response from server.");
      }

      setAuth(token, user);
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "OTP verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900">
            TowMech Admin Login
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Secure access to the TowMech operations dashboard.
          </p>
        </CardHeader>

        <CardContent>
          {step === "login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  placeholder="admin@towmech.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerify}>
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                Enter the OTP sent to <span className="font-medium">{email}</span>.
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">OTP</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                type="button"
                onClick={() => {
                  setOtp("");
                  setStep("login");
                }}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
