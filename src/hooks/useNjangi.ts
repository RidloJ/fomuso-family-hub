import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLastSunday, computeStatus } from "@/lib/njangi-utils";

export function useNjangiMembers() {
  return useQuery({
    queryKey: ["njangi-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("njangi_members")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useNjangiPeriod(month: number, year: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["njangi-period", month, year],
    queryFn: async () => {
      // Try to fetch existing period
      const { data, error } = await supabase
        .from("njangi_periods")
        .select("*")
        .eq("period_month", month)
        .eq("period_year", year)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;

      // Auto-create period if it doesn't exist
      const deadline = getLastSunday(year, month);
      const { data: members } = await supabase
        .from("njangi_members")
        .select("expected_monthly_amount")
        .eq("active", true);
      const expectedTotal = (members || []).reduce(
        (sum, m) => sum + (Number(m.expected_monthly_amount) || 0),
        0
      );

      const { data: created, error: createErr } = await supabase
        .from("njangi_periods")
        .insert({
          period_month: month,
          period_year: year,
          deadline_date: deadline.toISOString().split("T")[0],
          expected_total: expectedTotal,
          balance_left: expectedTotal,
          created_by: user!.id,
        })
        .select()
        .single();
      if (createErr) throw createErr;
      return created;
    },
    enabled: !!user,
  });
}

export function useNjangiPayments(periodId: string | undefined) {
  return useQuery({
    queryKey: ["njangi-payments", periodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("njangi_payments")
        .select("*, njangi_members(full_name)")
        .eq("period_id", periodId!)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!periodId,
  });
}

export function useRecordPayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      period_id: string;
      member_id: string;
      amount: number;
      payment_date: string;
      payment_method: string;
      note?: string;
    }) => {
      const { error } = await supabase.from("njangi_payments").insert({
        ...payment,
        payment_method: payment.payment_method as any,
        created_by: user!.id,
      });
      if (error) throw error;

      // Recalculate period totals
      const { data: payments } = await supabase
        .from("njangi_payments")
        .select("amount")
        .eq("period_id", payment.period_id);
      const totalRemitted = (payments || []).reduce((s, p) => s + Number(p.amount), 0);

      const { data: period } = await supabase
        .from("njangi_periods")
        .select("expected_total")
        .eq("id", payment.period_id)
        .single();

      const expectedTotal = Number(period?.expected_total || 0);
      const balanceLeft = Math.max(0, expectedTotal - totalRemitted);
      const status = computeStatus(totalRemitted, expectedTotal);

      await supabase
        .from("njangi_periods")
        .update({ total_remitted: totalRemitted, balance_left: balanceLeft, status })
        .eq("id", payment.period_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["njangi-period"] });
      queryClient.invalidateQueries({ queryKey: ["njangi-payments"] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      period_id: string;
      amount: number;
      payment_date: string;
      payment_method: string;
      note?: string;
    }) => {
      const { id, period_id, ...rest } = payload;
      const { error } = await supabase
        .from("njangi_payments")
        .update({ ...rest, payment_method: rest.payment_method as any })
        .eq("id", id);
      if (error) throw error;

      await recalcPeriod(period_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["njangi-period"] });
      queryClient.invalidateQueries({ queryKey: ["njangi-payments"] });
      queryClient.invalidateQueries({ queryKey: ["njangi-periods-year"] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; period_id: string }) => {
      const { error } = await supabase
        .from("njangi_payments")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;

      await recalcPeriod(payload.period_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["njangi-period"] });
      queryClient.invalidateQueries({ queryKey: ["njangi-payments"] });
      queryClient.invalidateQueries({ queryKey: ["njangi-periods-year"] });
    },
  });
}

async function recalcPeriod(periodId: string) {
  const { data: payments } = await supabase
    .from("njangi_payments")
    .select("amount")
    .eq("period_id", periodId);
  const totalRemitted = (payments || []).reduce((s, p) => s + Number(p.amount), 0);

  const { data: period } = await supabase
    .from("njangi_periods")
    .select("expected_total")
    .eq("id", periodId)
    .single();

  const expectedTotal = Number(period?.expected_total || 0);
  const balanceLeft = Math.max(0, expectedTotal - totalRemitted);
  const status = computeStatus(totalRemitted, expectedTotal);

  await supabase
    .from("njangi_periods")
    .update({ total_remitted: totalRemitted, balance_left: balanceLeft, status })
    .eq("id", periodId);
}

export function useAllNjangiPeriods(year: number) {
  return useQuery({
    queryKey: ["njangi-periods-year", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("njangi_periods")
        .select("*")
        .eq("period_year", year)
        .order("period_month");
      if (error) throw error;
      return data;
    },
  });
}
