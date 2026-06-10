import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  code?: string;
}

export function MockOtpModal({ open, onClose, code = "123456" }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-2xl p-6 z-10 w-96 shadow-xl">
        <h3 className="text-lg font-bold mb-2">Mock OTP (dev)</h3>
        <p className="text-sm text-stone-600 mb-4">Use this code to complete OTP verification in development:</p>
        <div className="text-3xl font-mono text-center bg-stone-100 p-4 rounded-md tracking-widest">{code}</div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold">Close</button>
        </div>
      </div>
    </div>
  );
}
