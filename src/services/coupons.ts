import { supabase, isSupabaseConfigured } from "./supabaseClient";

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  plan: "pro" | "firm";
  duration_days: number;
  discount_percent: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type ValidateResult =
  | { valid: true; coupon: CouponRow }
  | { valid: false; error: string };

export type RedeemResult =
  | { valid: true; plan: string; expiresAt: string; durationDays: number; message: string }
  | { valid: false; error: string };

export type UserPlan = {
  plan: "free" | "pro" | "firm";
  couponCode?: string;
  startedAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  expired?: boolean;
  viaTeam?: boolean;
};

export async function validateCoupon(code: string): Promise<ValidateResult> {
  if (!isSupabaseConfigured()) return { valid: false, error: "Service unavailable" };

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { valid: false, error: "Please enter a coupon code" };

  const { data, error } = await supabase!
    .from("coupons")
    .select("*")
    .ilike("code", trimmed)
    .single();

  if (error || !data) return { valid: false, error: "Invalid coupon code" };

  const coupon = data as CouponRow;

  if (!coupon.is_active) return { valid: false, error: "This coupon is no longer active" };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "This coupon has expired" };
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }

  return { valid: true, coupon };
}

export async function redeemCoupon(code: string, userId: string): Promise<RedeemResult> {
  const validation = await validateCoupon(code);
  if (!validation.valid) return validation;

  const coupon = validation.coupon;

  const { data: existing } = await supabase!
    .from("coupon_redemptions")
    .select("id")
    .eq("coupon_id", coupon.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { valid: false, error: "You've already used this coupon" };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + coupon.duration_days);
  const expiresAtISO = expiresAt.toISOString();

  const { error: planError } = await supabase!
    .from("user_plans")
    .upsert(
      {
        user_id: userId,
        plan: coupon.plan,
        coupon_code: coupon.code,
        started_at: new Date().toISOString(),
        expires_at: expiresAtISO,
        is_active: true,
      },
      { onConflict: "user_id" }
    );

  if (planError) return { valid: false, error: "Failed to activate plan. Please try again." };

  const { error: redeemError } = await supabase!
    .from("coupon_redemptions")
    .insert({ coupon_id: coupon.id, user_id: userId });

  if (redeemError) return { valid: false, error: "Failed to record redemption" };

  await supabase!
    .from("coupons")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", coupon.id);

  return {
    valid: true,
    plan: coupon.plan,
    expiresAt: expiresAtISO,
    durationDays: coupon.duration_days,
    message: `${coupon.plan.charAt(0).toUpperCase() + coupon.plan.slice(1)} plan activated for ${coupon.duration_days} days!`,
  };
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  if (!isSupabaseConfigured()) return { plan: "free" };

  try {
    const { data, error } = await supabase!
      .from("user_plans")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("getUserPlan: error fetching own plan:", error);
    }

    const ownPlanActive = !error && data && data.plan !== "free" &&
      !(data.expires_at && new Date(data.expires_at) < new Date());

    if (ownPlanActive) {
      return {
        plan: data.plan,
        couponCode: data.coupon_code ?? undefined,
        startedAt: data.started_at ?? undefined,
        expiresAt: data.expires_at ?? undefined,
        isActive: data.is_active,
      };
    }

    // No active plan of their own — check if this user belongs to a team
    // whose owner has an active Firm plan.
    try {
      const { data: userData } = await supabase!.auth.getUser();
      const userEmail = userData?.user?.email;

      if (userEmail) {
        const { data: membership, error: memberError } = await supabase!
          .from("team_members")
          .select("team_id, teams!inner(owner_id)")
          .eq("email", userEmail)
          .limit(1)
          .maybeSingle();

        if (memberError) {
          console.error("getUserPlan: error fetching team membership:", memberError);
        }

        const ownerId = (membership as any)?.teams?.owner_id;

        if (ownerId) {
          const { data: ownerPlan, error: ownerPlanError } = await supabase!
            .from("user_plans")
            .select("*")
            .eq("user_id", ownerId)
            .maybeSingle();

          if (ownerPlanError) {
            console.error("getUserPlan: error fetching owner plan:", ownerPlanError);
          }

          const ownerPlanActive = ownerPlan && ownerPlan.plan === "firm" &&
            !(ownerPlan.expires_at && new Date(ownerPlan.expires_at) < new Date());

          if (ownerPlanActive) {
            return {
              plan: "firm",
              expiresAt: ownerPlan.expires_at ?? undefined,
              isActive: true,
              viaTeam: true,
            };
          }
        }
      }
    } catch (teamErr) {
      console.error("getUserPlan: team membership check failed:", teamErr);
    }

    if (data && data.expires_at && new Date(data.expires_at) < new Date()) {
      return { plan: "free", expired: true };
    }

    return { plan: "free" };
  } catch (err) {
    console.error("getUserPlan failed entirely:", err);
    // Always return something — never let this hang or reject forever.
    return { plan: "free" };
  }
}

export async function getUserRedemptions(userId: string) {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from("coupon_redemptions")
    .select("id, redeemed_at, coupons(code, description, plan, duration_days)")
    .eq("user_id", userId)
    .order("redeemed_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
