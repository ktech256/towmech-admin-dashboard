"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Resolve API base URL safely for prod (Render) + dev (localhost)
 * Priority:
 * 1) NEXT_PUBLIC_API_URL
 * 2) NEXT_PUBLIC_API_URL
 * 3) If running on Render domain → force Render backend
 * 4) Dev fallback → localhost backend
 */
function resolveApiBase() {
  const env1 = process.env.NEXT_PUBLIC_API_URL;
  const env2 = process.env.NEXT_PUBLIC_API_URL;
  const fromEnv = (env1 || env2 || "").trim().replace(/\/+$/, "");

  if (fromEnv) return fromEnv;

  // If deployed on Render dashboard, force the backend domain (prevents localhost mistakes)
  if (typeof window !== "undefined") {
    const host = window.location.host || "";
    if (host.includes("onrender.com")) {
      return "https://towmech-main.onrender.com";
    }
  }

  // Local dev fallback
  return "http://localhost:5000";
}

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // IMPORTANT: do NOT set credentials unless you use cookies
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "Non-JSON response" };
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export default function LoginPage() {
  const router = useRouter();

  const apiBase = useMemo(() => resolveApiBase(), []);
  const loginUrl = `${apiBase}/api/auth/login`;
  const verifyOtpUrl = `${apiBase}/api/auth/verify-otp`;

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
      const data = await postJson(loginUrl, { phone, password });

      // ✅ CASE 1: Admin bypass returns token immediately
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

      // Anything else:
      setError(data?.message || "Unexpected response from server.");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await postJson(verifyOtpUrl, { phone, otp });

      const token = data?.token;
      if (!token) {
        setError("OTP verified but token missing from response.");
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("token", token); // optional compatibility
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "50px auto" }}>
      <h2>TowMech Admin Login</h2>

      {/* ✅ Debug line so we can SEE what URL the deployed app is using */}
      <p style={{ fontSize: 12, color: "#666" }}>
        API Base: <code>{apiBase}</code>
        <br />
        Login URL: <code>{loginUrl}</code>
      </p>

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