import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const ONBOARDING_ROUTE = "/onboarding";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const checkRegistration = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("registration_complete")
      .eq("user_id", userId)
      .single();
    return (data as any)?.registration_complete ?? false;
  };

  const handleAuthState = async (currentUser: User | null) => {
    setUser(currentUser);

    if (!currentUser) {
      setRegistrationComplete(null);
      setLoading(false);
      if (!PUBLIC_ROUTES.includes(location.pathname)) {
        navigate("/login");
      }
      return;
    }

    // Check registration status
    const complete = await checkRegistration(currentUser.id);
    setRegistrationComplete(complete);
    setLoading(false);

    if (!complete && location.pathname !== ONBOARDING_ROUTE && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate(ONBOARDING_ROUTE);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthState(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check when route changes (e.g. after onboarding)
  useEffect(() => {
    if (user && registrationComplete === false && location.pathname !== ONBOARDING_ROUTE && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate(ONBOARDING_ROUTE);
    }
  }, [location.pathname, user, registrationComplete, navigate]);

  return { user, loading, registrationComplete };
};
