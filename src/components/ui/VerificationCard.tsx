import React from "react";

interface Props {
  level?: string | null;
  status?: "not_verified" | "pending" | "verified" | "failed";
  onVerify?: () => void;
  onViewHistory?: () => void;
}

export function VerificationCard({ level, status = "not_verified", onVerify, onViewHistory }: Props) {
  const label = (() => {
    switch (status) {
      case "pending":
        return "Verification In Progress";
      case "verified":
        return "NIDA Verified";
      case "failed":
        return "Verification Failed";
      default:
        return "Not Verified";
    }
  })();

  return (
    <div className="border rounded-2xl p-4 bg-white">
      <h4 className="font-black mb-1">Verification</h4>
      <div className="text-sm text-stone-600 mb-3">Status: <span className="font-bold">{label}</span></div>
      <div className="flex gap-2">
        <button onClick={onVerify} className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-bold">Verify Identity</button>
        <button onClick={onViewHistory} className="px-3 py-2 bg-stone-100 rounded-lg">View History</button>
      </div>
    </div>
  );
}
