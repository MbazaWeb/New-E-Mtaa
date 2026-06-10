import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, UserProfile, Session } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-log";
import AUDIT_EVENTS from "@/lib/audit-events";
import type { SignUpUserData, SupabaseError } from "@/types";
import { IS_SUPABASE_CONFIGURED } from "@/lib/config";

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: SupabaseError | null }>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<SignUpUserData>,
  ) => Promise<{ error: unknown; user: unknown }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<{ error: SupabaseError | null }>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_LOAD_TIMEOUT_MS = 5000;

const withProfileTimeout = async <T,>(promise: Promise<T>): Promise<T | null> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), PROFILE_LOAD_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSupabaseConfigured = IS_SUPABASE_CONFIGURED;
  const authMode = (import.meta.env.VITE_AUTH_MODE as string | undefined) ??
    (import.meta.env.DEV ? "mock" : "production");
  const isMockAuth = authMode === "mock";

  const MOCK_AUTH_SESSION_KEY = "emtaa-mock-auth-session";

  const buildFallbackUser = (sessionUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
  }): UserProfile => ({
    id: sessionUser.id,
    email: sessionUser.email || "",
    first_name: sessionUser.user_metadata?.first_name || "User",
    middle_name: sessionUser.user_metadata?.middle_name || "",
    last_name: sessionUser.user_metadata?.last_name || "",
    phone: sessionUser.user_metadata?.phone || "",
    role: (sessionUser.user_metadata?.role as "citizen" | "staff" | "admin") || "citizen",
    is_verified: true, // true in fallback — real profile from DB determines the gate
    account_status: "active",
  });

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        const pgError = error as {
          code?: string;
          message: string;
          details?: string;
          hint?: string;
        };
        console.error("Error fetching user profile:", {
          code: pgError.code,
          message: pgError.message,
          details: pgError.details,
          hint: pgError.hint,
          userId,
        });
        return null;
      }

      if (!data) {
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      const profile = await fetchUserProfile(session.user.id);
      // Department membership detection
      if (profile) {
        console.log("[AUTH] Profile loaded:", {
          id: profile.id,
          role: profile.role,
          department_id: profile.department_id,
        });
        if (profile.department_id) {
          profile.is_department_member = true;
          console.log("[AUTH] Dept member via department_id column");
        } else if (profile.role === "staff" || profile.role === "admin") {
          try {
            const { data: deptRow, error: deptErr } = await supabase
              .from("department_users")
              .select("department_id, role")
              .eq("user_id", profile.id)
              .limit(1)
              .maybeSingle();
            console.log("[AUTH] department_users query:", { deptRow, deptErr });
            if (deptRow) {
              profile.is_department_member = true;
              profile.department_id = deptRow.department_id;
              console.log("[AUTH] Dept member via department_users query");
            } else {
              console.log("[AUTH] NOT a dept member (no department_users row found)");
            }
          } catch (e) {
            console.warn("[AUTH] Dept check exception:", e);
          }
        }
        console.log("[AUTH] Final is_department_member:", profile.is_department_member);
      }
      setUser(profile);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      if (isMockAuth) {
        if (!isMounted) return;
        if (typeof window !== "undefined") {
          const saved = window.localStorage.getItem(MOCK_AUTH_SESSION_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as { user: UserProfile };
            setSession({ user: parsed.user } as unknown as Session);
            setUser(parsed.user);
          }
        }
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) => {
          setTimeout(() => resolve({ data: { session: null } }), 15000);
        });

        const sessionPromise = supabase.auth.getSession();
        const {
          data: { session: currentSession },
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!isMounted) return;

        setSession(currentSession);
        if (currentSession?.user) {
          const profile = await withProfileTimeout(fetchUserProfile(currentSession.user.id));
          if (!isMounted) return;
          if (profile) {
            if (profile.department_id) {
              profile.is_department_member = true;
            } else if (profile.role === "staff" || profile.role === "admin") {
              try {
                const { data: deptRow } = await supabase
                  .from("department_users")
                  .select("department_id, role")
                  .eq("user_id", profile.id)
                  .limit(1)
                  .maybeSingle();
                if (deptRow) {
                  profile.is_department_member = true;
                  profile.department_id = deptRow.department_id;
                }
              } catch (e) {
                console.warn("Dept membership check failed:", e);
              }
            }
          }
          setUser(profile ?? buildFallbackUser(currentSession.user));
        } else {
          setUser(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession: Session | null) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(buildFallbackUser(newSession.user));
        setTimeout(() => {
          void withProfileTimeout(fetchUserProfile(newSession.user.id)).then((profile) => {
            if (isMounted && profile) setUser(profile);
          });
        }, 0);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  const signIn = async (email: string, password: string) => {
    if (isMockAuth) {
      if (typeof window === "undefined") {
        return { error: null };
      }
      const saved = window.localStorage.getItem(MOCK_AUTH_SESSION_KEY);
      if (!saved) {
        return { error: { message: "Invalid credentials" } as SupabaseError };
      }
      const parsed = JSON.parse(saved) as { user: UserProfile };
      if (parsed.user.email !== email) {
        return { error: { message: "Invalid credentials" } as SupabaseError };
      }
      const mockSession = { user: parsed.user } as unknown as Session;
      setSession(mockSession);
      setUser(parsed.user);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: Partial<SignUpUserData>) => {
    if (isMockAuth) {
      const mockUser: UserProfile = {
        id: `mock-${Date.now()}`,
        email,
        role: "citizen",
        is_verified: true,
        account_status: "active",
        verification_level: "PHONE_VERIFIED",
        ...userData,
        first_name: userData.first_name || "User",
        middle_name: userData.middle_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
      } as UserProfile;
      const mockSession = { user: mockUser } as unknown as Session;
      setSession(mockSession);
      setUser(mockUser);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MOCK_AUTH_SESSION_KEY, JSON.stringify({ user: mockUser }));
      }
      return { error: null, user: mockSession.user };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        // After the user clicks the confirmation link, Supabase returns them
        // here. Uses the current origin so it works in dev (localhost) and in
        // production (the Vercel domain) without hardcoding. The target URL
        // must also be added to Supabase Auth > URL Configuration > Redirect URLs.
        emailRedirectTo: `${window.location.origin}/confirm`,
      },
    });

    // Pilot behaviour: mark phone as verified and grant PHONE_VERIFIED level
    // when a user signs up (pilot mode uses mock OTP shown on-screen).
    try {
      if (data?.user?.id) {
        await supabase.from("users").upsert({
          id: data.user.id,
          account_status: "active",
          phone_verified: true,
          verification_level: "PHONE_VERIFIED",
          ...userData,
        });
        // Audit events
        try {
          // Log pilot verification events using existing activity actions
          logActivity(data.user.id, "verify_citizen", { method: "otp", pilot: true });
          logActivity(data.user.id, "update_profile", { field: "verification_level", value: "PHONE_VERIFIED" });
        } catch (e) {
          console.warn("Failed to log verification audit events:", e);
        }
      }
    } catch (e) {
      console.warn("Failed to upsert pilot verification fields on signUp:", e);
    }
    return { error, user: data?.user };
  };

  const signOut = async () => {
    logActivity(user?.id, "logout");
    setUser(null);
    setSession(null);
    if (isMockAuth) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(MOCK_AUTH_SESSION_KEY);
      }
      return;
    }

    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("signOut timeout")), 5000),
        ),
      ]);
    } catch {
      // Ignore — local state already cleared, user is logged out in the UI
    }
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    const { error } = await supabase.auth.updateUser({ data });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUser,
        fetchUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
