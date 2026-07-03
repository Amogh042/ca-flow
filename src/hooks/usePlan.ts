import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserPlan, redeemCoupon, getUserRedemptions } from "@/services/coupons";
import type { UserPlan } from "@/services/coupons";
import { useAuth } from "@/contexts/AuthContext";

export function usePlan() {
  const { user } = useAuth();
  return useQuery<UserPlan>({
    queryKey: ["user-plan", user?.id],
    queryFn: () => getUserPlan(user!.id),
    staleTime: 60000,
    enabled: !!user?.id,
    placeholderData: { plan: "free" },
    retry: 1,
  });
}

export function useRedeemCoupon() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemCoupon(code, user!.id),
    onSuccess(data) {
      if (data.valid) {
        qc.invalidateQueries({ queryKey: ["user-plan"] });
      }
    },
  });
}

export function useRedemptionHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["redemptions", user?.id],
    queryFn: () => getUserRedemptions(user!.id),
    staleTime: 60000,
    enabled: !!user?.id,
    placeholderData: [],
  });
}
