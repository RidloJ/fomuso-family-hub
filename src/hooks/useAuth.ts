import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const ONBOARDING_ROUTE = "/onboarding";
const PENDING_ROUTE = "/pending-approval";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState<boolean | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const checkProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("registration_complete, is_approved")
      .eq("user_id", userId)
      .single();
    return {
      registrationComplete: (data as any)?.registration_complete ?? false,
      isApproved: (data as any)?.is_approved ?? false,
    };
  };

  const handleAuthState = async (currentUser: User | null) => {
    setUser(currentUser);

    if (!currentUser) {
      setRegistrationComplete(null);
      setIsApproved(null);
      setLoading(false);
      if (!PUBLIC_ROUTES.includes(location.pathname)) {
        navigate("/login");
      }
      return;
    }

    const { registrationComplete: complete, isApproved: approved } = await checkProfile(currentUser.id);
    setRegistrationComplete(complete);
    setIsApproved(approved);
    setLoading(false);

    const isGatedRoute = !PUBLIC_ROUTES.includes(location.pathname) && location.pathname !== ONBOARDING_ROUTE && location.pathname !== PENDING_ROUTE;

    if (!approved && isGatedRoute) {
      navigate(PENDING_ROUTE);
    } else if (approved && !complete && location.pathname !== ONBOARDING_ROUTE && !PUBLIC_ROUTES.includes(location.pathname) && location.pathname !== PENDING_ROUTE) {
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

  // Re-check when route changes
  useEffect(() => {
    if (!user) return;
    const isGatedRoute = !PUBLIC_ROUTES.includes(location.pathname) && location.pathname !== ONBOARDING_ROUTE && location.pathname !== PENDING_ROUTE;
    if (isApproved === false && isGatedRoute) {
      navigate(PENDING_ROUTE);
    } else if (isApproved && registrationComplete === false && location.pathname !== ONBOARDING_ROUTE && !PUBLIC_ROUTES.includes(location.pathname) && location.pathname !== PENDING_ROUTE) {
      navigate(ONBOARDING_ROUTE);
    }
  }, [location.pathname, user, registrationComplete, isApproved, navigate]);

  return { user, loading, registrationComplete, isApproved };
};
