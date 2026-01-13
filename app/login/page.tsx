"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithPhonePassword, verifyOtp } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"LOGIN" | "OTP">("LOGIN");

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

      // Backend returns ONLY OTP sent message here
      if (data?.message?.toLowerCase().includes("otp")) {
        setStep("OTP");
        return;
      }

      setError("Unexpected response from server (OTP not triggered).");
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

      // ✅ Save token for your axios interceptor
      localStorage.setItem("adminToken", token);

      // ✅ redirect
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
          />

          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button onClick={handleLogin} disabled={loading} style={{ padding: 10 }}>
            {loading ? "..." : "Sign in"}
          </button>
        </>
      )}

      {step === "OTP" && (
        <>
          <p>OTP sent to: <strong>{phone}</strong></p>

          <label>OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            placeholder="Enter OTP"
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button onClick={handleVerifyOtp} disabled={loading} style={{ padding: 10 }}>
            {loading ? "..." : "Verify OTP"}
          </button>
        </>
      )}
    </div>
  );
}