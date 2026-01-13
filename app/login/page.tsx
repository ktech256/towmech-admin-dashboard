"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithPhonePassword, verifyOtp } from "@/lib/api/auth";

type Step = "LOGIN" | "OTP";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("LOGIN");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Optional debug display (safe)
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL_BASE ||
    process.env.NEXT_PUBLIC_API ||
    process.env.NEXT_PUBLIC_API_URL?.toString() ||
    "";

  const loginUrl = `${apiBase || "(env missing)"}/auth/login`;

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await loginWithPhonePassword({ phone, password });

      // ✅ CASE 1: Admin/SuperAdmin returns token immediately
      if (data?.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("token", data.token); // optional compatibility
        router.push("/dashboard");
        return;
      }

      // ✅ CASE 2: OTP required (customers/providers)
      const requiresOtp =
        data?.requiresOtp === true ||
        String(data?.message || "").toLowerCase().includes("otp");

      if (requiresOtp) {
        setStep("OTP");
        return;
      }

      // ✅ Any other response: show server message
      setError(data?.message || "Unexpected response from server.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await verifyOtp({ phone, otp });

      const token = data?.token;
      if (!token) {
        setError("OTP verified but token missing from response.");
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("token", token); // optional compatibility

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "50px auto" }}>
      <h2>TowMech Admin Login</h2>

      {/* ✅ Debug info so we can confirm prod is using correct API */}
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>
        <div>API Base: {apiBase || "(missing NEXT_PUBLIC_API_URL)"}</div>
        <div>Login URL: {loginUrl}</div>
      </div>

      {step === "LOGIN" && (
        <>
          <label>Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            placeholder="071..."
            autoComplete="username"
          />

          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            autoComplete="current-password"
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button onClick={handleLogin} disabled={loading} style={{ padding: 10 }}>
            {loading ? "..." : "Sign in"}
          </button>
        </>
      )}

      {step === "OTP" && (
        <>
          <p>
            OTP sent to: <strong>{phone}</strong>
          </p>

          <label>OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            placeholder="Enter OTP"
            inputMode="numeric"
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleVerifyOtp} disabled={loading} style={{ padding: 10 }}>
              {loading ? "..." : "Verify OTP"}
            </button>

            <button
              onClick={() => {
                setOtp("");
                setStep("LOGIN");
                setError("");
              }}
              disabled={loading}
              style={{ padding: 10 }}
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}