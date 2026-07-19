import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contex/AuthContex";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock, User, MessageSquare, Compass, ShieldCheck } from "lucide-react";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Login"); // Login, Sign Up
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Resend OTP state
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useContext(AuthContext);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const resendOtp = async () => {
    try {
      setResendLoading(true);
      const endpoint = currState === "Forgot Password" ? "/api/auth/forgot-password" : "/api/auth/resend-otp";
      const res = await axios.post(endpoint, { email });

      if (res.data.success) {
        toast.success("OTP code resent to your email.");
        setResendTimer(30);
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Failed to resend OTP code.");
    }
    setResendLoading(false);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (currState === "Forgot Password") {
      if (!otpSent) {
        try {
          setLoading(true);
          const res = await axios.post("/api/auth/forgot-password", { email });
          if (res.data.success) {
            toast.success("Password reset OTP sent to your email.");
            setOtpSent(true);
            setResendTimer(30);
          } else {
            toast.error(res.data.message);
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send reset OTP.");
        }
        setLoading(false);
      } else {
        try {
          setLoading(true);
          const res = await axios.post("/api/auth/reset-password", {
            email,
            otp,
            newPassword: password,
          });
          if (res.data.success) {
            toast.success("Password reset successfully!");
            // Log in with the new credentials
            await login("login", { email, password });
          } else {
            toast.error(res.data.message);
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to reset password.");
        }
        setLoading(false);
      }
      return;
    }

    if (currState === "Sign Up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    if (currState === "Sign Up" && !otpSent) {
      try {
        setLoading(true);
        const res = await axios.post("/api/auth/signup", {
          fullName,
          email,
          password,
          bio,
        });

        if (res.data.success) {
          // OTP temporarily disabled for deployment.
          // Re-enable after configuring a verified email domain:
          // toast.success("OTP sent successfully. Verify your email!");
          // setOtpSent(true);
          // setResendTimer(30);

          toast.success("🎉 Account created! Logging you in...");
          await login("login", { email, password });
        } else {
          toast.error(res.data.message);
          setIsDataSubmitted(false);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to submit signup details.");
        setIsDataSubmitted(false);
      }
      setLoading(false);
      return;
    }

    // OTP temporarily disabled for deployment.
    // Re-enable after configuring a verified email domain.
    // if (currState === "Sign Up" && otpSent) {
    //   try {
    //     setLoading(true);
    //     const res = await axios.post("/api/auth/verify-otp", {
    //       email,
    //       otp,
    //       password,
    //     });
    //     if (res.data.success) {
    //       toast.success("🎉 Account created successfully!");
    //       login("login", { email, password });
    //     } else {
    //       toast.error(res.data.message);
    //     }
    //   } catch (error) {
    //     toast.error(error.response?.data?.message || "Verification failed.");
    //   }
    //   setLoading(false);
    //   return;
    // }

    // Login process
    setLoading(true);
    await login("login", { email, password });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 animate-pop-in">
        
        {/* Logo/Identity */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg mb-3">
            <Compass className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
            Connectify
          </h1>
          <p className="text-xs text-gray-400 mt-1.5">
            {currState === "Forgot Password"
              ? "Reset your account password"
              : currState === "Sign Up"
              ? "Create your developer-ready space"
              : "Welcome back to your workspace"}
          </p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-4">
          
          {/* Step 1 Sign Up: Full Name */}
          {currState === "Sign Up" && !isDataSubmitted && (
            <div className="relative flex items-center">
              <User className="absolute left-3 w-4 h-4 text-gray-400" />
              <input
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
                type="text"
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                required
              />
            </div>
          )}

          {/* Email and Password inputs (Only shown before submission/verification for standard flows) */}
          {!isDataSubmitted && currState !== "Forgot Password" && (
            <>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                  required
                />
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type="password"
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                  required
                />
              </div>
              {currState === "Login" && (
                <div className="flex justify-end text-xs px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrState("Forgot Password");
                      setOtpSent(false);
                      setIsDataSubmitted(false);
                      setEmail("");
                      setPassword("");
                      setOtp("");
                    }}
                    className="text-violet-400 hover:underline font-medium cursor-pointer bg-transparent border-none"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          )}

          {/* Forgot Password Step 1: Request OTP */}
          {currState === "Forgot Password" && !otpSent && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 text-center mb-2">
                Enter your registered email address to receive a 6-digit password reset OTP code.
              </p>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                  required
                />
              </div>
            </div>
          )}

          {/* Forgot Password Step 2: Verification Code & New Password */}
          {currState === "Forgot Password" && otpSent && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 text-center mb-2">
                Enter the 6-digit verification code sent to your email and your new password.
              </p>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                  required
                />
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type="password"
                  placeholder="New Password"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                  required
                />
              </div>

              {/* Resend timer */}
              <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                {resendTimer > 0 ? (
                  <span>Resend code in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={resendLoading}
                    onClick={resendOtp}
                    className="text-violet-400 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {resendLoading ? "Resending..." : "Resend Code"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2 Sign Up: Bio (TextArea) */}
          {currState === "Sign Up" && isDataSubmitted && !otpSent && (
            <div className="space-y-3">
              <textarea
                onChange={(e) => setBio(e.target.value)}
                value={bio}
                rows={4}
                placeholder="Write a short bio about yourself..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-violet-500 transition text-white resize-none"
                required
              />
            </div>
          )}

          {/* Step 3 Sign Up: OTP input — temporarily disabled for deployment */}
          {/* Re-enable after configuring a verified email domain */}
          {/* {currState === "Sign Up" && otpSent && (
            <div className="space-y-3">
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                  required
                />
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                {resendTimer > 0 ? (
                  <span>Resend code in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={resendLoading}
                    onClick={resendOtp}
                    className="text-violet-400 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {resendLoading ? "Resending..." : "Resend Code"}
                  </button>
                )}
              </div>
            </div>
          )} */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg cursor-pointer hover:scale-[1.01] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currState === "Forgot Password" ? (
              otpSent ? "Reset Password & Login" : "Send Reset OTP"
            ) : currState === "Sign Up" ? (
              // OTP temporarily disabled: removed "Send Verification OTP" and "Verify & Register" steps
              isDataSubmitted ? "Create Account" : "Next Step"
            ) : (
              "Login to Workspace"
            )}
          </button>

          {/* Switch States options */}
          <div className="text-center pt-2">
            {currState === "Forgot Password" ? (
              <p className="text-xs text-gray-500">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCurrState("Login");
                    setIsDataSubmitted(false);
                    setOtpSent(false);
                    setResendTimer(0);
                    setEmail("");
                    setPassword("");
                    setOtp("");
                  }}
                  className="text-violet-400 font-semibold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            ) : currState === "Sign Up" ? (
              <p className="text-xs text-gray-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCurrState("Login");
                    setIsDataSubmitted(false);
                    setOtpSent(false);
                    setResendTimer(0);
                  }}
                  className="text-violet-400 font-semibold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setCurrState("Sign Up")}
                  className="text-violet-400 font-semibold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
