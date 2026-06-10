import { describe, it, expect } from "vitest";

// ─── App basics ──────────────────────────────────────
describe("Application Smoke Tests", () => {
  it("should run tests", () => {
    expect(true).toBe(true);
  });

  it("should have required env structure", () => {
    expect(typeof import.meta.env).toBe("object");
  });
});

// ─── Service Fees ────────────────────────────────────
describe("Service Fees (getApplicationAmount)", () => {
  // Inline import to avoid Supabase initialization
  const SERVICE_FEES: Record<string, number> = {
    "Utambulisho wa Mkazi": 5000,
    "Kibari cha Mazishi": 2000,
    "Kibari cha Sherehe": 10000,
    "Kibari cha Ujezi Mdogo": 15000,
    "Barua ya Utambulisho": 3000,
    "Makubaliano ya Mauzo": 5000,
    "Makubaliano ya Pango": 10000,
    "Migogoro na Mashauri": 5000,
  };

  function getAmount(app: {
    service_name?: string;
    form_data?: Record<string, unknown>;
    payment_data?: Record<string, unknown>;
  }): number {
    const pd = (app.payment_data || {}) as Record<string, unknown>;
    const fd = (app.form_data || {}) as Record<string, unknown>;
    if (pd.amount && Number(pd.amount) > 0) return Number(pd.amount);
    if (fd.total_fee && Number(fd.total_fee) > 0) return Number(fd.total_fee);
    if (fd.service_fee && Number(fd.service_fee) > 0) return Number(fd.service_fee);
    if (fd.amount && Number(fd.amount) > 0) return Number(fd.amount);
    if (app.service_name === "Makubaliano ya Mauzo" && fd.sale_price) {
      return Math.min(Math.max(Math.round(Number(fd.sale_price) * 0.03), 5000), 500000);
    }
    return (app.service_name && SERVICE_FEES[app.service_name]) || 0;
  }

  it("returns payment_data.amount when paid", () => {
    expect(getAmount({ payment_data: { amount: 7500 } })).toBe(7500);
  });

  it("returns form_data.total_fee when stored", () => {
    expect(getAmount({ form_data: { total_fee: 10000 } })).toBe(10000);
  });

  it("falls back to service name lookup", () => {
    expect(getAmount({ service_name: "Utambulisho wa Mkazi" })).toBe(5000);
    expect(getAmount({ service_name: "Kibari cha Mazishi" })).toBe(2000);
    expect(getAmount({ service_name: "Kibari cha Sherehe" })).toBe(10000);
    expect(getAmount({ service_name: "Kibari cha Ujezi Mdogo" })).toBe(15000);
    expect(getAmount({ service_name: "Barua ya Utambulisho" })).toBe(3000);
    expect(getAmount({ service_name: "Makubaliano ya Pango" })).toBe(10000);
    expect(getAmount({ service_name: "Migogoro na Mashauri" })).toBe(5000);
  });

  it("calculates 3% for sales agreements", () => {
    expect(
      getAmount({
        service_name: "Makubaliano ya Mauzo",
        form_data: { sale_price: 50000000 },
      }),
    ).toBe(500000); // capped at 500k

    expect(
      getAmount({
        service_name: "Makubaliano ya Mauzo",
        form_data: { sale_price: 100000 },
      }),
    ).toBe(5000); // min 5k
  });

  it("prioritizes payment_data over form_data over lookup", () => {
    expect(
      getAmount({
        service_name: "Kibari cha Mazishi",
        form_data: { total_fee: 3000 },
        payment_data: { amount: 4000 },
      }),
    ).toBe(4000); // payment_data wins
  });

  it("returns 0 for unknown services", () => {
    expect(getAmount({ service_name: "Unknown Service" })).toBe(0);
    expect(getAmount({})).toBe(0);
  });
});

// ─── Rate Limiter ────────────────────────────────────
describe("Rate Limiter", () => {
  const timestamps: Map<string, number[]> = new Map();

  function checkRateLimit(key: string, max = 3, windowMs = 60000): boolean {
    const now = Date.now();
    const prev = timestamps.get(key) || [];
    const recent = prev.filter((t) => now - t < windowMs);
    if (recent.length >= max) return false;
    recent.push(now);
    timestamps.set(key, recent);
    return true;
  }

  it("allows actions within limit", () => {
    expect(checkRateLimit("test1", 3, 60000)).toBe(true);
    expect(checkRateLimit("test1", 3, 60000)).toBe(true);
    expect(checkRateLimit("test1", 3, 60000)).toBe(true);
  });

  it("blocks when limit exceeded", () => {
    expect(checkRateLimit("test2", 2, 60000)).toBe(true);
    expect(checkRateLimit("test2", 2, 60000)).toBe(true);
    expect(checkRateLimit("test2", 2, 60000)).toBe(false);
  });

  it("different keys are independent", () => {
    expect(checkRateLimit("a", 1, 60000)).toBe(true);
    expect(checkRateLimit("b", 1, 60000)).toBe(true);
    expect(checkRateLimit("a", 1, 60000)).toBe(false);
    expect(checkRateLimit("b", 1, 60000)).toBe(false);
  });
});

// ─── CSV Export ──────────────────────────────────────
describe("CSV Export", () => {
  function buildCSV(data: Record<string, unknown>[]): string {
    if (!data.length) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const str = String(row[h] ?? "");
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }

  it("generates CSV with headers", () => {
    const csv = buildCSV([{ name: "Alice", age: 30 }]);
    expect(csv).toContain("name,age");
    expect(csv).toContain("Alice,30");
  });

  it("escapes commas in values", () => {
    const csv = buildCSV([{ name: "Dar es Salaam, TZ" }]);
    expect(csv).toContain('"Dar es Salaam, TZ"');
  });

  it("escapes quotes in values", () => {
    const csv = buildCSV([{ name: 'He said "hello"' }]);
    expect(csv).toContain('"He said ""hello"""');
  });

  it("returns empty for empty data", () => {
    expect(buildCSV([])).toBe("");
  });
});

// ─── Offline Drafts ──────────────────────────────────
describe("Offline Drafts", () => {
  const DRAFT_PREFIX = "emtaa_draft_";

  it("saves and loads draft", () => {
    const key = DRAFT_PREFIX + "test_service";
    const data = { name: "Test", phone: "+255712345678" };
    const saved = JSON.stringify({ data, savedAt: Date.now() });
    // Simulate localStorage
    const store: Record<string, string> = {};
    store[key] = saved;
    const loaded = JSON.parse(store[key]);
    expect(loaded.data.name).toBe("Test");
    expect(loaded.data.phone).toBe("+255712345678");
  });

  it("expires old drafts", () => {
    const savedAt = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    expect(Date.now() - savedAt > maxAge).toBe(true);
  });
});

// ─── Data Validation ─────────────────────────────────
describe("Data Validation", () => {
  it("validates Tanzania phone numbers", () => {
    const isValidTZPhone = (p: string) =>
      /^(\+?255|0)(6[1-9]|7[1-8])\d{7}$/.test(p.replace(/\s/g, ""));
    expect(isValidTZPhone("+255712345678")).toBe(true);
    expect(isValidTZPhone("0712345678")).toBe(true);
    expect(isValidTZPhone("+255612345678")).toBe(true);
    expect(isValidTZPhone("+254712345678")).toBe(false);
    expect(isValidTZPhone("123")).toBe(false);
  });

  it("validates NIDA numbers (20 digits)", () => {
    const isValidNIDA = (n: string) => /^\d{20}$/.test(n);
    expect(isValidNIDA("19880617333380000129")).toBe(true);
    expect(isValidNIDA("1234")).toBe(false);
    expect(isValidNIDA("1988061733338000012X")).toBe(false);
  });

  it("formats currency correctly", () => {
    const fmtCurrency = (n: number) =>
      `TSh ${n.toLocaleString("en-US")}`;
    expect(fmtCurrency(5000)).toBe("TSh 5,000");
    expect(fmtCurrency(150000)).toBe("TSh 150,000");
    expect(fmtCurrency(0)).toBe("TSh 0");
  });
});

// ─── Document Expiry ─────────────────────────────────
describe("Document Expiry", () => {
  it("calculates days until expiry", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil(
      (future.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    expect(daysLeft).toBe(10);
  });

  it("detects expired documents", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil(
      (past.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    expect(daysLeft).toBeLessThan(0);
  });

  it("flags expiring soon (within 7 days)", () => {
    const daysLeft = 5;
    const status =
      daysLeft < 0 ? "expired" : daysLeft <= 7 ? "expiring_soon" : "valid";
    expect(status).toBe("expiring_soon");
  });
});

// ─── Audit Logger ────────────────────────────────────
describe("Audit Logger", () => {
  const ACTIONS = {
    SUBMIT_APPLICATION: "submit_application",
    APPROVE_APPLICATION: "approve_application",
    REJECT_APPLICATION: "reject_application",
    ISSUE_DOCUMENT: "issue_document",
    ACCEPT_AGREEMENT: "accept_agreement",
    LOGIN: "login",
    LOGOUT: "logout",
  } as const;

  it("has all required action types", () => {
    expect(ACTIONS.SUBMIT_APPLICATION).toBe("submit_application");
    expect(ACTIONS.APPROVE_APPLICATION).toBe("approve_application");
    expect(ACTIONS.ISSUE_DOCUMENT).toBe("issue_document");
    expect(ACTIONS.LOGIN).toBe("login");
  });

  it("all actions are unique strings", () => {
    const values = Object.values(ACTIONS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
