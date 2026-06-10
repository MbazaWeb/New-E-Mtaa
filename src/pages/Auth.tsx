import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";
import { IS_SUPABASE_CONFIGURED } from "@/lib/config";
import { TANZANIA_LOGO_URL } from "@/constants/services";

interface AuthProps {
  mode: "login" | "signup";
  onClose: () => void;
  setMode: (mode: "login" | "signup") => void;
}

export function Auth({ mode, onClose, setMode }: AuthProps) {
  const { fetchUserProfile } = useAuth();
  const { lang, t } = useLanguage();
  const { showToast } = useToast();

  // ==================== COMMON STATE ====================
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"citizen" | "staff">("citizen");

  // ==================== LOGIN STATE ====================
  const [loginMethod, setLoginMethod] = useState<"mobile" | "email">("mobile");
  const [loginMobile, setLoginMobile] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // ==================== FORGOT PASSWORD STATE ====================
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "password">("email");
  const [resendCountdown, setResendCountdown] = useState(0);

  // ==================== OTP LOGIN STATE ====================
  const [otpLoginMethod, setOtpLoginMethod] = useState<"mobile" | "email">("mobile");
  const [otpLoginValue, setOtpLoginValue] = useState("");
  const [otpLoginCode, setOtpLoginCode] = useState("");
  const [otpLoginSent, setOtpLoginSent] = useState(false);
  const [otpLoginLoading, setOtpLoginLoading] = useState(false);

  // ==================== SIGNUP STATE ====================
  const [regForm, setRegForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupOtpCode, setSignupOtpCode] = useState("");
  const [signupStep, setSignupStep] = useState<"form" | "otp">("form");

  // ==================== HELPERS ====================
  const isSupabaseConfigured = IS_SUPABASE_CONFIGURED;

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/[\s\-()]/g, "");
    const tzPattern = /^(?:\+255|0)[67]\d{8}$/;
    return tzPattern.test(clean);
  };

  const normalizePhone = (phone: string): string => {
    const clean = phone.replace(/[\s\-()]/g, "");
    if (clean.startsWith("0")) {
      return "+255" + clean.slice(1);
    }
    if (clean.startsWith("+255")) {
      return clean;
    }
    return "+255" + clean;
  };

  const startResendCountdown = () => {
    setResendCountdown(30);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ==================== SIGNUP FLOW ====================
  const handleSendSignupOtp = async () => {
    // Validation
    if (!regForm.firstName.trim()) {
      showToast(lang === "sw" ? "Tafadhali ingiza jina la kwanza" : "Please enter first name", "error");
      return;
    }
    if (!regForm.lastName.trim()) {
      showToast(lang === "sw" ? "Tafadhali ingiza jina la mwisho" : "Please enter last name", "error");
      return;
    }
    if (!regForm.phone || !validatePhone(regForm.phone)) {
      showToast(
        lang === "sw"
          ? "Tafadhali ingiza namba sahihi ya simu (06xxxxxxx au 07xxxxxxx)"
          : "Please enter a valid phone number (06xxxxxxx or 07xxxxxxx)",
        "error"
      );
      return;
    }
    if (!regForm.email) {
      showToast(lang === "sw" ? "Tafadhali ingiza barua pepe" : "Please enter email", "error");
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      showToast(lang === "sw" ? "Nywila hazifanani" : "Passwords do not match", "error");
      return;
    }
    if (regForm.password.length < 6) {
      showToast(
        lang === "sw" ? "Nywila lazima iwe na herufi 6 au zaidi" : "Password must be at least 6 characters",
        "error"
      );
      return;
    }

    if (!isSupabaseConfigured) {
      showToast(
        lang === "sw"
          ? "Mfumo haujasanidiwa. Tafadhali wasiliana na msimamizi."
          : "System not configured. Please contact administrator.",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      // Send OTP to email for verification
      const { error } = await supabase.auth.signInWithOtp({
        email: regForm.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setSignupOtpSent(true);
      startResendCountdown();
      showToast(
        lang === "sw"
          ? `Nambari ya uthibitisho imetumwa kwa ${regForm.email}`
          : `Verification code sent to ${regForm.email}`,
        "success"
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || (lang === "sw" ? "Hitilafu imetokea" : "An error occurred"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupOtp = async () => {
    if (!signupOtpCode || signupOtpCode.length < 6) {
      showToast(lang === "sw" ? "Tafadhali ingiza nambari ya uthibitisho" : "Please enter verification code", "error");
      return;
    }

    setLoading(true);
    try {
      // First verify OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: regForm.email,
        token: signupOtpCode,
        type: "email",
      });

      if (verifyError) throw verifyError;

      // Then create the user account
      const normalizedPhone = normalizePhone(regForm.phone);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regForm.email,
        password: regForm.password,
        options: {
          data: {
            first_name: regForm.firstName.trim().toUpperCase(),
            middle_name: regForm.middleName.trim().toUpperCase() || null,
            last_name: regForm.lastName.trim().toUpperCase(),
            phone: normalizedPhone,
            role: "citizen",
            account_status: "active",
            verification_level: "PHONE_VERIFIED",
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          throw new Error(
            lang === "sw"
              ? "Barua pepe hii tayari imesajiliwa. Tafadhali ingia."
              : "This email is already registered. Please login."
          );
        }
        throw signUpError;
      }

      if (!data.user) {
        throw new Error(
          lang === "sw"
            ? "Usajili umeshindwa. Tafadhali jaribu tena."
            : "Signup failed. Please try again."
        );
      }

      // Create minimal profile in users table (in case trigger doesn't fire)
      const { error: profileError } = await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: regForm.email,
          first_name: regForm.firstName.trim().toUpperCase(),
          middle_name: regForm.middleName.trim().toUpperCase() || null,
          last_name: regForm.lastName.trim().toUpperCase(),
          phone: normalizedPhone,
          role: "citizen",
          account_status: "active",
          verification_level: "PHONE_VERIFIED",
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.warn("Profile creation warning:", profileError);
        // Non-blocking — profile can be completed later
      }

      showToast(
        lang === "sw"
          ? "Akaunti imeundwa kikamilifu! Unaweza kuingia sasa."
          : "Account created successfully! You can now login.",
        "success"
      );

      // Reset and close
      setSignupStep("form");
      setSignupOtpSent(false);
      setSignupOtpCode("");
      setMode("login");
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Signup error:", error.message);
      showToast(error.message || (lang === "sw" ? "Hitilafu imetokea" : "An error occurred"), "error");
    } finally {
      setLoading(false);
    }
  };

  const resendSignupOtp = async () => {
    if (resendCountdown > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: regForm.email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      startResendCountdown();
      showToast(
        lang === "sw" ? "Nambia mpya imetumwa" : "New code sent",
        "success"
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || (lang === "sw" ? "Hitilafu" : "Error"), "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOGIN FLOW ====================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      showToast(
        lang === "sw"
          ? "Mfumo haujasanidiwa. Tafadhali wasiliana na msimamizi."
          : "System not configured. Please contact administrator.",
        "error"
      );
      return;
    }

    let email = "";
    let password = "";

    if (accountType === "staff") {
      email = loginEmail;
      password = loginPassword;
    } else {
      if (loginMethod === "mobile") {
        if (!loginMobile || !validatePhone(loginMobile)) {
          showToast(
            lang === "sw"
              ? "Tafadhali ingiza namba sahihi ya simu"
              : "Please enter a valid phone number",
            "error"
          );
          return;
        }
        // For mobile login, we need email — but citizens sign up with email
        // So mobile login should use phone/OTP, not password
        // For now, require email login for citizens with password
        showToast(
          lang === "sw"
            ? "Tafadhali tumia barua pepe kuingia. Au bonyeza 'Login via SMS OTP'"
            : "Please use email to login. Or click 'Login via SMS OTP'",
          "error"
        );
        return;
      } else {
        email = loginEmail;
        password = loginPassword;
      }
    }

    if (!email || !password) {
      showToast(
        lang === "sw" ? "Tafadhali jaza sehemu zote" : "Please fill in all fields",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error(
            lang === "sw"
              ? "Barua pepe yako bado haijathibitishwa. Tafadhali kagua barua pepe yako."
              : "Your email is not confirmed yet. Please check your inbox."
          );
        }
        if (error.message.includes("Invalid login credentials")) {
          throw new Error(
            lang === "sw" ? "Barua pepe au nywila si sahihi." : "Incorrect email or password."
          );
        }
        throw error;
      }

      if (data.user) {
        await fetchUserProfile(data.user.id).catch(() => {});
      }

      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || (lang === "sw" ? "Kuingia kumeshindwa" : "Login failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== OTP LOGIN FLOW ====================
  const handleSendOtpLogin = async () => {
    if (!otpLoginValue.trim()) {
      showToast(
        lang === "sw" ? "Tafadhali ingiza barua pepe au namba ya simu" : "Please enter email or phone number",
        "error"
      );
      return;
    }

    setOtpLoginLoading(true);
    try {
      if (otpLoginMethod === "email") {
        const { error } = await supabase.auth.signInWithOtp({
          email: otpLoginValue.trim(),
        });
        if (error) throw error;
      } else {
        let phone = otpLoginValue.trim();
        if (!validatePhone(phone)) {
          throw new Error(
            lang === "sw"
              ? "Namba ya simu si sahihi. Tumia 06xxxxxxx au 07xxxxxxx"
              : "Invalid phone number. Use 06xxxxxxx or 07xxxxxxx"
          );
        }
        phone = normalizePhone(phone);
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        });
        if (error) throw error;
      }
      setOtpLoginSent(true);
      startResendCountdown();
      showToast(
        lang === "sw" ? "Nambari ya uthibitisho imetumwa" : "Verification code sent",
        "success"
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || (lang === "sw" ? "Hitilafu" : "Error"), "error");
    } finally {
      setOtpLoginLoading(false);
    }
  };

  const handleVerifyOtpLogin = async () => {
    if (!otpLoginCode || otpLoginCode.length < 6) {
      showToast(lang === "sw" ? "Ingiza nambari ya uthibitisho" : "Enter verification code", "error");
      return;
    }

    setOtpLoginLoading(true);
    try {
      let verifyPayload;
      if (otpLoginMethod === "email") {
        verifyPayload = {
          email: otpLoginValue.trim(),
          token: otpLoginCode,
          type: "email" as const,
        };
      } else {
        verifyPayload = {
          phone: normalizePhone(otpLoginValue.trim()),
          token: otpLoginCode,
          type: "sms" as const,
        };
      }

      const { error } = await supabase.auth.verifyOtp(verifyPayload);
      if (error) throw error;

      showToast(
        lang === "sw" ? "Umeingia kikamilifu!" : "Logged in successfully!",
        "success"
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(
        error.message || (lang === "sw" ? "Nambari si sahihi" : "Invalid code"),
        "error"
      );
    } finally {
      setOtpLoginLoading(false);
    }
  };

  const resetOtpLogin = () => {
    setOtpLoginSent(false);
    setOtpLoginCode("");
    setOtpLoginValue("");
  };

  // ==================== FORGOT PASSWORD FLOW ====================
  const handleForgotSendOtp = async () => {
    if (!forgotEmail.trim()) {
      showToast(lang === "sw" ? "Ingiza barua pepe yako" : "Enter your email", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;

      setForgotOtpSent(true);
      setForgotStep("otp");
      startResendCountdown();
      showToast(
        lang === "sw" ? "Nambari ya uthibitisho imetumwa kwa barua pepe yako" : "Verification code sent to your email",
        "success"
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || (lang === "sw" ? "Hitilafu" : "Error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async () => {
    if (!forgotOtpCode || forgotOtpCode.length < 6) {
      showToast(lang === "sw" ? "Ingiza nambari ya uthibitisho" : "Enter verification code", "error");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP and continue to password reset
      const { error } = await supabase.auth.verifyOtp({
        email: forgotEmail,
        token: forgotOtpCode,
        type: "email",
      });

      if (error) throw error;

      setForgotStep("password");
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || (lang === "sw" ? "Nambari si sahihi" : "Invalid code"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResetPassword = async () => {
    if (forgotNewPassword !== forgotConfirmPassword) {
      showToast(lang === "sw" ? "Nywila hazifanani" : "Passwords do not match", "error");
      return;
    }
    if (forgotNewPassword.length < 6) {
      showToast(
        lang === "sw" ? "Nywila lazima iwe na herufi 6 au zaidi" : "Password must be at least 6 characters",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: forgotNewPassword,
      });

      if (error) throw error;

      showToast(
        lang === "sw" ? "Nywila imebadilishwa kikamilifu!" : "Password reset successfully!",
        "success"
      );
      setShowForgotPassword(false);
      setForgotStep("email");
      setForgotEmail("");
      setForgotOtpCode("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setForgotOtpSent(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || (lang === "sw" ? "Hitilafu" : "Error"), "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER LOGIN ====================
  const renderLogin = () => (
    <div className="max-w-md mx-auto py-4">
      <AnimatePresence mode="wait">
        {!showForgotPassword ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Account Type Toggle */}
            <div className="flex gap-2 mb-6 bg-stone-100 p-1 rounded-2xl">
              <button
                onClick={() => setAccountType("citizen")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  accountType === "citizen"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {lang === "sw" ? "Raia" : "Citizen"}
              </button>
              <button
                onClick={() => setAccountType("staff")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  accountType === "staff"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {lang === "sw" ? "Mtumishi / Msimamizi" : "Staff / Admin"}
              </button>
            </div>

            {accountType === "staff" ? (
              // Staff/Admin Login
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                    {lang === "sw" ? "Barua pepe" : "Email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      placeholder="juma@e-mtaa.go.tz"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                      {lang === "sw" ? "Nenosiri" : "Password"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      {lang === "sw" ? "Umesahau Nywila?" : "Forgot Password?"}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full h-14 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  type="submit"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (lang === "sw" ? "Ingia" : "Login")}
                </button>
              </form>
            ) : (
              // Citizen Login
              <>
                {/* Login Method Tabs */}
                <div className="flex gap-2 mb-6 bg-stone-100 p-1 rounded-2xl">
                  <button
                    onClick={() => setLoginMethod("mobile")}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      loginMethod === "mobile"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    {lang === "sw" ? "Simu" : "Mobile"}
                  </button>
                  <button
                    onClick={() => setLoginMethod("email")}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      loginMethod === "email"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    {lang === "sw" ? "Barua pepe" : "Email"}
                  </button>
                </div>

                {!otpLoginSent ? (
                  <form onSubmit={handleLogin} className="space-y-5">
                    {loginMethod === "mobile" ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === "sw" ? "Namba ya simu" : "Mobile Number"}
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                          <input
                            type="tel"
                            value={loginMobile}
                            onChange={(e) => setLoginMobile(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            placeholder="0712345678"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400">
                          {lang === "sw"
                            ? "Ingiza namba kuanzia 06 au 07"
                            : "Enter number starting with 06 or 07"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === "sw" ? "Barua pepe" : "Email"}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                          <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            placeholder="juma@example.com"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {(loginMethod === "email" || loginMethod === "mobile") && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                            {lang === "sw" ? "Nenosiri" : "Password"}
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            {lang === "sw" ? "Umesahau Nywila?" : "Forgot Password?"}
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full h-14 pl-12 pr-12 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      disabled={loading}
                      className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
                      type="submit"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : (lang === "sw" ? "Ingia" : "Login")}
                    </button>

                    {/* OTP Login Link */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setOtpLoginSent(false)}
                        className="text-sm text-emerald-600 font-bold hover:underline"
                      >
                        {loginMethod === "mobile"
                          ? (lang === "sw" ? "Ingia kwa SMS OTP" : "Login via SMS OTP")
                          : (lang === "sw" ? "Ingia kwa Email OTP" : "Login via Email OTP")}
                      </button>
                    </div>
                  </form>
                ) : (
                  // OTP Login Form
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                        {otpLoginMethod === "mobile" ? (
                          <>
                            <Phone size={13} /> {lang === "sw" ? "Ingia kwa SMS" : "Login via SMS"}
                          </>
                        ) : (
                          <>
                            <Mail size={13} /> {lang === "sw" ? "Ingia kwa Email OTP" : "Login via Email OTP"}
                          </>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={resetOtpLogin}
                        className="text-xs text-stone-400 hover:text-stone-600 font-bold"
                      >
                        {lang === "sw" ? "Badilisha" : "Change"}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {otpLoginMethod === "mobile"
                            ? (lang === "sw" ? "Namba ya simu" : "Phone Number")
                            : (lang === "sw" ? "Barua pepe" : "Email")}
                        </label>
                        <input
                          type={otpLoginMethod === "mobile" ? "tel" : "email"}
                          value={otpLoginValue}
                          onChange={(e) => setOtpLoginValue(e.target.value)}
                          placeholder={otpLoginMethod === "mobile" ? "0712345678" : "juma@example.com"}
                          className="w-full h-12 px-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm mt-1"
                          disabled={otpLoginSent}
                        />
                      </div>

                      {!otpLoginSent ? (
                        <button
                          type="button"
                          disabled={otpLoginLoading}
                          onClick={handleSendOtpLogin}
                          className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {otpLoginLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                          {lang === "sw" ? "Tuma OTP" : "Send OTP"}
                        </button>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                              {lang === "sw" ? "Nambari ya OTP" : "OTP Code"}
                            </label>
                            <input
                              type="text"
                              value={otpLoginCode}
                              onChange={(e) => setOtpLoginCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="000000"
                              maxLength={6}
                              className="w-full h-14 px-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-2xl font-mono font-bold tracking-[0.5em] mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSendOtpLogin}
                              disabled={resendCountdown > 0}
                              className="flex-1 h-11 bg-stone-100 text-stone-600 rounded-xl font-bold text-xs hover:bg-stone-200 disabled:opacity-50"
                            >
                              {resendCountdown > 0 ? `${resendCountdown}s` : (lang === "sw" ? "Tuma Tena" : "Resend")}
                            </button>
                            <button
                              type="button"
                              disabled={otpLoginLoading || otpLoginCode.length < 6}
                              onClick={handleVerifyOtpLogin}
                              className="flex-[2] h-11 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {otpLoginLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                              {lang === "sw" ? "Thibitisha" : "Verify"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center pt-4">
                  <p className="text-sm text-stone-500">
                    {lang === "sw" ? "Hauna akaunti?" : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-emerald-600 font-bold hover:underline"
                    >
                      {lang === "sw" ? "Jisajili" : "Sign up"}
                    </button>
                  </p>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          // Forgot Password Flow
          <motion.div
            key="forgot-password"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotStep("email");
                setForgotOtpSent(false);
              }}
              className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 mb-4"
            >
              ← {lang === "sw" ? "Rudi kwenye kuingia" : "Back to login"}
            </button>

            <h3 className="text-lg font-bold text-stone-900">
              {lang === "sw" ? "Rudisha Nywila" : "Reset Password"}
            </h3>

            {forgotStep === "email" && (
              <div className="space-y-4">
                <p className="text-sm text-stone-500">
                  {lang === "sw"
                    ? "Tutakutumia nambari ya uthibitisho kwenye barua pepe yako."
                    : "We'll send a verification code to your email."}
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                    {lang === "sw" ? "Barua pepe" : "Email"}
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="juma@example.com"
                    required
                  />
                </div>
                <button
                  disabled={loading}
                  onClick={handleForgotSendOtp}
                  className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (lang === "sw" ? "Tuma OTP" : "Send OTP")}
                </button>
              </div>
            )}

            {forgotStep === "otp" && (
              <div className="space-y-4">
                <p className="text-sm text-stone-500">
                  {lang === "sw"
                    ? `Nambari ya uthibitisho imetumwa kwa ${forgotEmail}`
                    : `Verification code sent to ${forgotEmail}`}
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                    {lang === "sw" ? "Nambari ya OTP" : "OTP Code"}
                  </label>
                  <input
                    type="text"
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center text-2xl font-mono font-bold tracking-[0.5em]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleForgotSendOtp}
                    disabled={resendCountdown > 0}
                    className="flex-1 h-11 bg-stone-100 text-stone-600 rounded-xl font-bold text-xs hover:bg-stone-200 disabled:opacity-50"
                  >
                    {resendCountdown > 0 ? `${resendCountdown}s` : (lang === "sw" ? "Tuma Tena" : "Resend")}
                  </button>
                  <button
                    disabled={loading || forgotOtpCode.length < 6}
                    onClick={handleForgotVerifyOtp}
                    className="flex-[2] h-11 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : (lang === "sw" ? "Thibitisha" : "Verify")}
                  </button>
                </div>
              </div>
            )}

            {forgotStep === "password" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                    {lang === "sw" ? "Nywila Mpya" : "New Password"}
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                    {lang === "sw" ? "Thibitisha Nywila Mpya" : "Confirm New Password"}
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  disabled={loading}
                  onClick={handleForgotResetPassword}
                  className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (lang === "sw" ? "Badilisha Nywila" : "Reset Password")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ==================== RENDER SIGNUP ====================
  const renderSignup = () => (
    <div className="max-w-md mx-auto py-4">
      <AnimatePresence mode="wait">
        {signupStep === "form" ? (
          <motion.div
            key="signup-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            <h3 className="text-lg font-bold text-stone-900 mb-4">
              {lang === "sw" ? "Jisajili kama Raia" : "Register as Citizen"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                  {lang === "sw" ? "Jina la Kwanza" : "First Name"} *
                </label>
                <input
                  type="text"
                  value={regForm.firstName}
                  onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                  className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder={lang === "sw" ? "Jina la Kwanza" : "First Name"}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                  {lang === "sw" ? "Jina la Mwisho" : "Last Name"} *
                </label>
                <input
                  type="text"
                  value={regForm.lastName}
                  onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                  className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder={lang === "sw" ? "Jina la Mwisho" : "Last Name"}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                {lang === "sw" ? "Jina la Kati" : "Middle Name"}
              </label>
              <input
                type="text"
                value={regForm.middleName}
                onChange={(e) => setRegForm({ ...regForm, middleName: e.target.value })}
                className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder={lang === "sw" ? "Jina la Kati (si lazima)" : "Middle Name (optional)"}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                {lang === "sw" ? "Namba ya Simu" : "Phone Number"} *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full h-12 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="0712345678"
                />
              </div>
              <p className="text-[10px] text-stone-400">
                {lang === "sw"
                  ? "Ingiza namba kuanzia 06 au 07 (bila nchi mwanzoni)"
                  : "Enter number starting with 06 or 07 (no country code)"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                {lang === "sw" ? "Barua pepe" : "Email"} *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full h-12 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="juma@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                  {lang === "sw" ? "Nenosiri" : "Password"} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full h-12 pl-12 pr-10 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                  {lang === "sw" ? "Thibitisha Nywila" : "Confirm Password"} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    className="w-full h-12 pl-12 pr-10 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600" />
                <span className="text-xs text-stone-500 leading-relaxed">
                  {lang === "sw"
                    ? "Ninakubali Vigezo na Masharti ya E-Mtaa na Sera ya Faragha."
                    : "I agree to the E-Mtaa Terms and Conditions and Privacy Policy."}
                </span>
              </label>
            </div>

            <button
              onClick={handleSendSignupOtp}
              disabled={loading}
              className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : (lang === "sw" ? "Endelea" : "Continue")}
              <ArrowRight size={20} />
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-stone-500">
                {lang === "sw" ? "Tayari una akaunti?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  {lang === "sw" ? "Ingia" : "Login"}
                </button>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="signup-otp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                {lang === "sw" ? "Thibitisha Barua Pepe Yako" : "Verify Your Email"}
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                {lang === "sw"
                  ? `Nambari ya uthibitisho imetumwa kwa ${regForm.email}`
                  : `Verification code sent to ${regForm.email}`}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                {lang === "sw" ? "Nambari ya OTP" : "OTP Code"}
              </label>
              <input
                type="text"
                value={signupOtpCode}
                onChange={(e) => setSignupOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center text-2xl font-mono font-bold tracking-[0.5em]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={resendSignupOtp}
                disabled={resendCountdown > 0}
                className="flex-1 h-11 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-200 disabled:opacity-50"
              >
                {resendCountdown > 0 ? `${resendCountdown}s` : (lang === "sw" ? "Tuma Tena" : "Resend")}
              </button>
              <button
                onClick={handleVerifySignupOtp}
                disabled={loading || signupOtpCode.length < 6}
                className="flex-[2] h-11 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {lang === "sw" ? "Thibitisha na Jisajili" : "Verify & Sign Up"}
              </button>
            </div>

            <button
              onClick={() => {
                setSignupStep("form");
                setSignupOtpSent(false);
                setSignupOtpCode("");
              }}
              className="w-full text-center text-sm text-stone-500 hover:text-stone-700 py-2"
            >
              ← {lang === "sw" ? "Rudi kwenye fomu" : "Back to form"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-0 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full h-full sm:h-auto sm:max-w-lg bg-white sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-screen sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center">
              <img
                src={TANZANIA_LOGO_URL}
                alt="Coat of Arms"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-stone-900">
                {mode === "login" ? t("nav.login") : t("nav.signup")}
              </h2>
              <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">
                E-MTAA PORTAL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
            title="Close"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {mode === "login" ? renderLogin() : renderSignup()}
        </div>
      </motion.div>
    </div>
  );
}