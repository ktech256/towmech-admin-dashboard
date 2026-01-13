"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithPhonePassword, verifyOtp } from "@/lib/api/auth";

type LoginStep = "LOGIN" | "OTP";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<LoginStep>("LOGIN");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await loginWithPhonePassword({ phone, password });

      // ✅ CASE 1: Admin/SuperAdmin bypass OTP → token returned immediately
      if (data?.token) {
        localStorage.setItem("adminToken", data.token);
        router.push("/dashboard");
        return;
      }

      // ✅ CASE 2: OTP flow
      const requiresOtp = data?.requiresOtp === true;
      const messageHasOtp = String(data?.message || "").toLowerCase().includes("otp");

      if (requiresOtp || messageHasOtp) {
        setStep("OTP");
        return;
      }

      // ❌ If we get here, backend response shape doesn't match expectations
      setError("Unexpected response from server. No token and OTP not triggered.");
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