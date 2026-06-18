
// Modular salary deduction engines with selectable insurance components.
// Add a new country by exporting an Engine and registering it in `ENGINES`.

export type Period = "monthly" | "annual";

export type InsuranceKey = "health" | "pension" | "employment";

export interface InsuranceOption {
  key: InsuranceKey;
  label: string;
  hint: string;
}

export interface DeductionBreakdown {
  socialInsurance: number;
  incomeTax: number;
  residentTax: number;
  other?: number;
}

export interface CalcInput {
  grossAnnual: number;
  insurance: Record<InsuranceKey, boolean>;
}

export interface CalcResult {
  grossAnnual: number;
  grossMonthly: number;
  deductions: DeductionBreakdown;
  totalDeductions: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
}

export interface CountryEngine {
  code: string;
  label: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  defaultGrossAnnual: number;
  insuranceOptions: InsuranceOption[];
  compute: (input: CalcInput) => DeductionBreakdown;
}

const round = (n: number) => Math.max(0, Math.round(n));

/* -------------------------------- Japan -------------------------------- */
function jpSocial(gross: number, ins: CalcInput["insurance"]): number {
  const monthly = Math.min(gross / 12, 1_390_000);
  const rate =
    (ins.health ? 0.05 : 0) +
    (ins.pension ? 0.0915 : 0) +
    (ins.employment ? 0.006 : 0);
  return round(monthly * rate * 12);
}

function jpIncomeTax(taxable: number): number {
  const brackets: Array<[number, number, number]> = [
    [1_950_000, 0.05, 0],
    [3_300_000, 0.1, 97_500],
    [6_950_000, 0.2, 427_500],
    [9_000_000, 0.23, 636_000],
    [18_000_000, 0.33, 1_536_000],
    [40_000_000, 0.4, 2_796_000],
    [Infinity, 0.45, 4_796_000],
  ];
  const t = Math.max(0, taxable);
  for (const [limit, rate, ded] of brackets) {
    if (t <= limit) return round((t * rate - ded) * 1.021);
  }
  return 0;
}

function jpEmploymentDeduction(g: number): number {
  if (g <= 1_625_000) return 550_000;
  if (g <= 1_800_000) return g * 0.4 - 100_000;
  if (g <= 3_600_000) return g * 0.3 + 80_000;
  if (g <= 6_600_000) return g * 0.2 + 440_000;
  if (g <= 8_500_000) return g * 0.1 + 1_100_000;
  return 1_950_000;
}

const japan: CountryEngine = {
  code: "JP",
  label: "Japan",
  currency: "JPY",
  currencySymbol: "¥",
  locale: "ja-JP",
  defaultGrossAnnual: 6_000_000,
  insuranceOptions: [
    { key: "health", label: "Health insurance", hint: "Kenkō Hoken ~5.0%" },
    { key: "pension", label: "Pension", hint: "Kōsei Nenkin 9.15%" },
    { key: "employment", label: "Employment", hint: "Koyō Hoken 0.6%" },
  ],
  compute: ({ grossAnnual, insurance }) => {
    const social = jpSocial(grossAnnual, insurance);
    const empDed = jpEmploymentDeduction(grossAnnual);
    const taxableNat = Math.max(0, grossAnnual - empDed - social - 480_000);
    const taxableRes = Math.max(0, grossAnnual - empDed - social - 430_000);
    return {
      socialInsurance: social,
      incomeTax: jpIncomeTax(taxableNat),
      residentTax: round(taxableRes * 0.1 + 5_000),
    };
  },
};

/* -------------------------------- USA -------------------------------- */
const usa: CountryEngine = {
  code: "US",
  label: "United States",
  currency: "USD",
  currencySymbol: "$",
  locale: "en-US",
  defaultGrossAnnual: 75_000,
  insuranceOptions: [
    { key: "pension", label: "Social Security", hint: "6.2% up to $168.6k" },
    { key: "health", label: "Medicare", hint: "1.45%" },
    { key: "employment", label: "State disability (est.)", hint: "~0.9%" },
  ],
  compute: ({ grossAnnual, insurance }) => {
    let social = 0;
    if (insurance.pension) social += Math.min(grossAnnual, 168_600) * 0.062;
    if (insurance.health) social += grossAnnual * 0.0145;
    if (insurance.employment) social += grossAnnual * 0.009;

    const taxable = Math.max(0, grossAnnual - 14_600);
    const brackets: Array<[number, number]> = [
      [11_600, 0.1],
      [47_150, 0.12],
      [100_525, 0.22],
      [191_950, 0.24],
      [243_725, 0.32],
      [609_350, 0.35],
      [Infinity, 0.37],
    ];
    let tax = 0;
    let prev = 0;
    for (const [limit, rate] of brackets) {
      if (taxable > limit) {
        tax += (limit - prev) * rate;
        prev = limit;
      } else {
        tax += (taxable - prev) * rate;
        break;
      }
    }
    return {
      socialInsurance: round(social),
      incomeTax: round(tax),
      residentTax: 0,
    };
  },
};

/* -------------------------------- UK -------------------------------- */
const uk: CountryEngine = {
  code: "UK",
  label: "United Kingdom",
  currency: "GBP",
  currencySymbol: "£",
  locale: "en-GB",
  defaultGrossAnnual: 35_000,
  insuranceOptions: [
    { key: "pension", label: "National Insurance", hint: "Class 1 employee" },
    { key: "health", label: "NHS levy (incl.)", hint: "Funded via tax" },
    { key: "employment", label: "Workplace pension", hint: "Auto-enrol 5%" },
  ],
  compute: ({ grossAnnual, insurance }) => {
    let ni = 0;
    if (insurance.pension) {
      if (grossAnnual > 12_570)
        ni += Math.min(grossAnnual - 12_570, 50_270 - 12_570) * 0.08;
      if (grossAnnual > 50_270) ni += (grossAnnual - 50_270) * 0.02;
    }
    if (insurance.employment) ni += Math.max(0, grossAnnual - 6_240) * 0.05;

    let allowance = 12_570;
    if (grossAnnual > 100_000)
      allowance = Math.max(0, 12_570 - (grossAnnual - 100_000) / 2);
    const taxable = Math.max(0, grossAnnual - allowance);
    let tax = 0;
    const basic = Math.min(taxable, 37_700);
    tax += basic * 0.2;
    const higher = Math.min(
      Math.max(taxable - 37_700, 0),
      125_140 - 12_570 - 37_700,
    );
    tax += higher * 0.4;
    tax += Math.max(taxable - (125_140 - 12_570), 0) * 0.45;
    return {
      socialInsurance: round(ni),
      incomeTax: round(tax),
      residentTax: 0,
    };
  },
};

/* -------------------------------- Germany (simple) -------------------------------- */
const germany: CountryEngine = {
  code: "DE",
  label: "Germany",
  currency: "EUR",
  currencySymbol: "€",
  locale: "de-DE",
  defaultGrossAnnual: 55_000,
  insuranceOptions: [
    { key: "health", label: "Health & care", hint: "~8.55% employee" },
    { key: "pension", label: "Pension", hint: "9.3%" },
    { key: "employment", label: "Unemployment", hint: "1.3%" },
  ],
  compute: ({ grossAnnual, insurance }) => {
    let social = 0;
    if (insurance.health) social += Math.min(grossAnnual, 62_100) * 0.0855;
    if (insurance.pension) social += Math.min(grossAnnual, 90_600) * 0.093;
    if (insurance.employment) social += Math.min(grossAnnual, 90_600) * 0.013;
    // Very simplified single-filer income tax (Klasse I) approximation.
    const t = Math.max(0, grossAnnual - 11_604 - social);
    let tax = 0;
    if (t <= 17_005) tax = t * 0.14 + (t * t) / 250_000;
    else if (t <= 66_760) tax = t * 0.24 + (t * t) / 600_000;
    else if (t <= 277_825) tax = t * 0.42 - 10_000;
    else tax = t * 0.45 - 18_000;
    return {
      socialInsurance: round(social),
      incomeTax: round(tax),
      residentTax: 0,
    };
  },
};

export const ENGINES: Record<string, CountryEngine> = {
  JP: japan,
  US: usa,
  UK: uk,
  DE: germany,
};

export function defaultInsurance(engine: CountryEngine): Record<InsuranceKey, boolean> {
  const out: Record<InsuranceKey, boolean> = {
    health: false,
    pension: false,
    employment: false,
  };
  for (const o of engine.insuranceOptions) out[o.key] = true;
  return out;
}

export function calculate(
  countryCode: string,
  amount: number,
  period: Period,
  insurance: Record<InsuranceKey, boolean>,
): CalcResult {
  const engine = ENGINES[countryCode] ?? japan;
  const grossAnnual = period === "monthly" ? amount * 12 : amount;
  const deductions = engine.compute({ grossAnnual, insurance });
  const total =
    deductions.socialInsurance +
    deductions.incomeTax +
    deductions.residentTax +
    (deductions.other ?? 0);
  const netAnnual = Math.max(0, grossAnnual - total);
  return {
    grossAnnual,
    grossMonthly: grossAnnual / 12,
    deductions,
    totalDeductions: total,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: grossAnnual > 0 ? total / grossAnnual : 0,
  };
}

export function getEngine(code: string): CountryEngine {
  return ENGINES[code] ?? japan;
}
