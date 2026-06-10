import { UserProfile } from "./supabase";

/**
 * Compute profile progress based on mandatory sections defined by E-MTAA v2.3
 * Sections: Identity (first+last+phone) -> 25%, Personal -> 25%, Address -> 25%, Contact -> 25%
 */
export function computeProfileProgress(profile: Partial<UserProfile> | null): number {
  if (!profile) return 0;
  let score = 0;

  // Identity: full name + phone
  const identityOk = !!(profile.first_name && profile.last_name && (profile.phone || profile.phone));
  if (identityOk) score += 25;

  // Personal: date of birth + gender + nationality
  const personalOk = !!(
    (profile.date_of_birth || profile.birth_date) && (profile.gender || profile.sex) && profile.nationality
  );
  if (personalOk) score += 25;

  // Address: region, district, ward, street/village
  const addressOk = !!(profile.region && profile.district && profile.ward && profile.street);
  if (addressOk) score += 25;

  // Contact: email
  const contactOk = !!(profile.email || profile.email_address || profile.alternative_email);
  if (contactOk) score += 25;

  return score;
}

/**
 * Determine verification level for a user profile. Prefers explicit `verification_level` when present.
 */
export function determineVerificationLevel(profile: Partial<UserProfile> | null): string {
  if (!profile) return "UNVERIFIED";
  // Use explicit field if present, but ignore explicit UNVERIFIED so actual verified state can still compute.
  if (profile.verification_level && profile.verification_level !== "UNVERIFIED") {
    return String(profile.verification_level);
  }

  // NIDA verified wins
  if (profile.nida_verified) return "NIDA_VERIFIED";

  // Profile completed
  const progress = computeProfileProgress(profile);
  if (progress === 100 || profile.profile_completed) return "PROFILE_COMPLETED";

  // Phone verified (best-effort using existing flags)
  if (profile.phone_verified || profile.is_verified) return "PHONE_VERIFIED";

  return "UNVERIFIED";
}

/**
 * Determine service eligibility and recommended workflow based on category.
 * Returns { eligible, workflow } where workflow is one of: 'immediate', 'staff_review', 'staff_mandatory'
 */
export function isServiceEligible(
  category: "CATEGORY_A" | "CATEGORY_B" | "CATEGORY_C",
  profile: Partial<UserProfile> | null,
): { eligible: boolean; workflow: "immediate" | "staff_review" | "staff_mandatory"; reason?: string } {
  const level = determineVerificationLevel(profile);

  if (category === "CATEGORY_A") {
    if (level === "PHONE_VERIFIED" || level === "PROFILE_COMPLETED" || level === "NIDA_VERIFIED") {
      return { eligible: true, workflow: "immediate" };
    }
    return { eligible: false, workflow: "immediate", reason: "Requires phone verification" };
  }

  if (category === "CATEGORY_B") {
    // PROFILE_COMPLETED required; if NIDA_VERIFIED - faster workflow
    if (level === "PROFILE_COMPLETED" || level === "NIDA_VERIFIED") {
      return { eligible: true, workflow: level === "NIDA_VERIFIED" ? "immediate" : "staff_review" };
    }
    return { eligible: false, workflow: "staff_review", reason: "Requires profile completion" };
  }

  // CATEGORY_C: always requires staff review
  if (category === "CATEGORY_C") {
    if (level === "PROFILE_COMPLETED" || level === "NIDA_VERIFIED") {
      return { eligible: true, workflow: "staff_mandatory" };
    }
    return { eligible: false, workflow: "staff_mandatory", reason: "Requires profile completion" };
  }

  return { eligible: false, workflow: "staff_review", reason: "Unknown category" };
}

export default { computeProfileProgress, determineVerificationLevel, isServiceEligible };
