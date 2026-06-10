import React from "react";
import { computeProfileProgress } from "@/lib/verification";

interface Props {
  profile: any;
  onUpdate?: () => void;
}

export function ProfileCompletionCard({ profile, onUpdate }: Props) {
  const progress = profile?.profile_progress ?? computeProfileProgress(profile ?? {});
  const missing: string[] = [];
  if (!profile?.first_name) missing.push("Full name");
  if (!profile?.phone) missing.push("Mobile number");
  if (!profile?.date_of_birth) missing.push("Date of birth");
  if (!profile?.region) missing.push("Region");
  if (!profile?.street) missing.push("Street");

  return (
    <div className="border rounded-2xl p-4 bg-white">
      <h4 className="font-black mb-2">Profile Completion</h4>
      <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden mb-3">
        <div className="h-3 bg-emerald-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-sm text-stone-600 mb-2">{progress}% complete</div>
      <div className="text-xs text-stone-500 mb-3">Missing: {missing.length ? missing.join(", ") : "None"}</div>
      <div className="text-right">
        <button onClick={onUpdate} className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-bold">Update Profile</button>
      </div>
    </div>
  );
}
