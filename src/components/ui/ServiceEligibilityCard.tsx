import React from "react";
import { isServiceEligible } from "@/lib/verification";

interface Props {
  profile: any;
}

export function ServiceEligibilityCard({ profile }: Props) {
  const categories = ["Category A", "Category B", "Category C"];

  return (
    <div className="border rounded-2xl p-4 bg-white">
      <h4 className="font-black mb-2">Service Eligibility</h4>
      <ul className="space-y-2">
        {categories.map((c) => {
          const catKey = c.split(" ")[1]?.toLowerCase() || "a";
          const res = isServiceEligible(catKey as any, profile ?? null);
          return (
            <li key={c} className="flex items-center justify-between">
              <div className="text-sm font-bold">{c}</div>
              <div className={`text-xs font-semibold ${res.eligible ? "text-emerald-600" : "text-stone-500"}`}>
                {res.eligible ? "Eligible" : "Not eligible"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
