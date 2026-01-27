"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginWithPhonePassword,
  verifyOtp,
  forgotPassword,
  resetPassword,
} from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<
    "LOGIN" | "OTP" | "FORGOT" | "RESET"
  >("LOGIN");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000";

  const loginUrl = `${API_BASE.replace(/\/$/, "")}/api/auth/login`;

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await loginWithPhonePassword({ phone, password });

      // ✅ CASE 1: Admin / SuperAdmin returns token immediately
      if (data?.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("token", data.token); // compatibility
        console.log("✅ Saved adminToken:", data.token);

        router.push("/dashboard");
        return;
      }

      // ✅ CASE 2: OTP flow for customers/providers
      const requiresOtp =
        data?.requiresOtp === true ||
        String(data?.message || "").toLowerCase().includes("otp");

      if (requiresOtp) {
        setStep("OTP");
        return;
      }

      setError(data?.message || "Unexpected response from server.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await verifyOtp({ phone, otp });

      const token = data?.token;
      if (!token) {
        setError("OTP verified but token missing from response.");
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("token", token); // compatibility

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot Password → request OTP for reset
  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await forgotPassword({ phone });

      // Always show success message (backend returns success even if user not found)
      setSuccess(res?.message || "If your phone exists, an SMS code has been sent ✅");
      setStep("RESET");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to send reset code ❌");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset Password → OTP + new password
  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (!newPassword || newPassword.length < 4) {
      setError("New password is too short.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({ phone, otp, newPassword });

      setSuccess(res?.message || "Password reset successful ✅");
      // Go back to login
      setPassword("");
      setNewPassword("");
      setOtp("");
      setStep("LOGIN");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Reset failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const resetAllMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div style={{ maxWidth: 420, margin: "50px auto" }}>
      <h2>TowMech Admin Login</h2>

      <p style={{ fontSize: 12, opacity: 0.7 }}>
        API Base: {API_BASE}
        <br />
        Login URL: {loginUrl}
      </p>

      {/* ✅ Common Phone Field (used across flows) */}
      {(step === "LOGIN" || step === "OTP" || step === "FORGOT" || step === "RESET") && (
        <>
          <label>Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            placeholder="071..."
            autoComplete="username"
          />
        </>
      )}

      {step === "LOGIN" && (
        <>
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            autoComplete="current-password"
          />

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <button onClick={handleLogin} disabled={loading} style={{ padding: 10 }}>
            {loading ? "..." : "Sign in"}
          </button>

          <button
            onClick={() => {
              resetAllMessages();
              setStep("FORGOT");
            }}
            disabled={loading}
            style={{ padding: 10, marginLeft: 10 }}
          >
            Forgot password?
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
          {success && <p style={{ color: "green" }}>{success}</p>}

          <button onClick={handleVerifyOtp} disabled={loading} style={{ padding: 10 }}>
            {loading ? "..." : "Verify OTP"}
          </button>

          <button
            onClick={() => {
              setOtp("");
              setStep("LOGIN");
              resetAllMessages();
            }}
            disabled={loading}
            style={{ padding: 10, marginLeft: 10 }}
          >
            Back
          </button>
        </>
      )}

      {step === "FORGOT" && (
        <>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Enter your phone number and we will send a reset OTP.
          </p>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <button
            onClick={handleForgotPassword}
            disabled={loading}
            style={{ padding: 10 }}
          >
            {loading ? "..." : "Send reset OTP"}
          </button>

          <button
            onClick={() => {
              setStep("LOGIN");
              resetAllMessages();
            }}
            disabled={loading}
            style={{ padding: 10, marginLeft: 10 }}
          >
            Back
          </button>
        </>
      )}

      {step === "RESET" && (
        <>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Enter the OTP sent to <strong>{phone}</strong> and choose a new password.
          </p>

          <label>OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            placeholder="Enter OTP"
            inputMode="numeric"
          />

          <label>New Password</label>
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            placeholder="Enter new password"
            autoComplete="new-password"
          />

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <button
            onClick={handleResetPassword}
            disabled={loading}
            style={{ padding: 10 }}
          >
            {loading ? "..." : "Reset password"}
          </button>

          <button
            onClick={() => {
              setStep("LOGIN");
              resetAllMessages();
            }}
            disabled={loading}
            style={{ padding: 10, marginLeft: 10 }}
          >
            Back to login
          </button>
        </>
      )}
    </div>
  );
}