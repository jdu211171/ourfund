// Modular salary deduction engines with selectable insurance components.
// Add a new country by exporting an Engine and registering it in `ENGINES`.

export type Period = 'monthly' | 'annual'

export type InsuranceKey =
  | 'health'
  | 'longTermCare'
  | 'childCareSupport'
  | 'pension'
  | 'employment'
  | 'incomeTax'
  | 'incomeSurtax'
  | 'residentIncomeTax'
  | 'residentPerCapitaTax'
  | 'socialSecurity'
  | 'medicare'
  | 'additionalMedicare'
  | 'stateTax'
  | 'nationalInsurance'
  | 'workplacePension'
  | 'care'
  | 'solidarity'
  | 'churchTax'

export interface InsuranceOption {
  key: InsuranceKey
  label: string
  hint: string
  defaultOn?: boolean
}

export type DeductionCategory = 'social' | 'tax' | 'local' | 'other'

export interface DeductionItem {
  key: InsuranceKey
  label: string
  amount: number
  category: DeductionCategory
}

export interface DeductionBreakdown {
  socialInsurance: number
  incomeTax: number
  residentTax: number
  other?: number
  items: DeductionItem[]
}

export interface CalcInput {
  grossAnnual: number
  insurance: Record<InsuranceKey, boolean>
}

export interface CalcResult {
  grossAnnual: number
  grossMonthly: number
  deductions: DeductionBreakdown
  totalDeductions: number
  netAnnual: number
  netMonthly: number
  effectiveRate: number
}

export interface CountryEngine {
  code: string
  label: string
  currency: string
  currencySymbol: string
  locale: string
  defaultGrossAnnual: number
  insuranceOptions: InsuranceOption[]
  compute: (input: CalcInput) => DeductionBreakdown
}

const round = (n: number) => Math.max(0, Math.round(n))
const on = (insurance: Partial<Record<InsuranceKey, boolean>>, key: InsuranceKey) =>
  insurance[key] ?? false
const sum = (items: DeductionItem[], category: DeductionCategory) =>
  round(
    items.filter(item => item.category === category).reduce((acc, item) => acc + item.amount, 0)
  )
const byCategory = (items: DeductionItem[]): DeductionBreakdown => ({
  socialInsurance: sum(items, 'social'),
  incomeTax: sum(items, 'tax'),
  residentTax: sum(items, 'local'),
  other: sum(items, 'other'),
  items: items.filter(item => item.amount > 0)
})

/* -------------------------------- Japan -------------------------------- */
function jpIncomeTax(taxable: number): number {
  const brackets: Array<[number, number, number]> = [
    [1_950_000, 0.05, 0],
    [3_300_000, 0.1, 97_500],
    [6_950_000, 0.2, 427_500],
    [9_000_000, 0.23, 636_000],
    [18_000_000, 0.33, 1_536_000],
    [40_000_000, 0.4, 2_796_000],
    [Infinity, 0.45, 4_796_000]
  ]
  const t = Math.max(0, taxable)
  for (const [limit, rate, ded] of brackets) {
    if (t <= limit) return round((t * rate - ded) * 1.021)
  }
  return 0
}

function jpEmploymentDeduction(g: number): number {
  if (g <= 1_625_000) return 550_000
  if (g <= 1_800_000) return g * 0.4 - 100_000
  if (g <= 3_600_000) return g * 0.3 + 80_000
  if (g <= 6_600_000) return g * 0.2 + 440_000
  if (g <= 8_500_000) return g * 0.1 + 1_100_000
  return 1_950_000
}

const japan: CountryEngine = {
  code: 'JP',
  label: 'Japan',
  currency: 'JPY',
  currencySymbol: '¥',
  locale: 'ja-JP',
  defaultGrossAnnual: 6_000_000,
  insuranceOptions: [
    { key: 'health', label: 'Health insurance', hint: 'Kenkō Hoken 4.925% (Tokyo est.)' },
    { key: 'longTermCare', label: 'Long-term care', hint: 'Kaigo 0.81%, age 40-64' },
    { key: 'childCareSupport', label: 'Childcare support levy', hint: 'Kodomo kosodate 0.115%' },
    { key: 'pension', label: 'Pension', hint: 'Kōsei Nenkin 9.15%' },
    { key: 'employment', label: 'Employment', hint: 'Koyō Hoken 0.5%' },
    { key: 'incomeTax', label: 'National income tax', hint: 'Progressive 5-45%' },
    { key: 'incomeSurtax', label: 'Reconstruction surtax', hint: '2.1% of national tax' },
    { key: 'residentIncomeTax', label: 'Resident income tax', hint: 'Prefecture/city ~10%' },
    {
      key: 'residentPerCapitaTax',
      label: 'Resident per-capita tax',
      hint: 'Flat local amount est.'
    }
  ],
  compute: ({ grossAnnual, insurance }) => {
    const monthlyHealthBase = Math.min(grossAnnual / 12, 1_390_000)
    const monthlyPensionBase = Math.min(grossAnnual / 12, 650_000)
    const socialItems: DeductionItem[] = [
      {
        key: 'health',
        label: 'Health insurance',
        amount: on(insurance, 'health') ? round(monthlyHealthBase * 0.04925 * 12) : 0,
        category: 'social'
      },
      {
        key: 'longTermCare',
        label: 'Long-term care',
        amount: on(insurance, 'longTermCare') ? round(monthlyHealthBase * 0.0081 * 12) : 0,
        category: 'social'
      },
      {
        key: 'childCareSupport',
        label: 'Childcare support levy',
        amount: on(insurance, 'childCareSupport') ? round(monthlyHealthBase * 0.00115 * 12) : 0,
        category: 'social'
      },
      {
        key: 'pension',
        label: 'Employee pension',
        amount: on(insurance, 'pension') ? round(monthlyPensionBase * 0.0915 * 12) : 0,
        category: 'social'
      },
      {
        key: 'employment',
        label: 'Employment insurance',
        amount: on(insurance, 'employment') ? round(grossAnnual * 0.005) : 0,
        category: 'social'
      }
    ]
    const social = sum(socialItems, 'social')
    const empDed = jpEmploymentDeduction(grossAnnual)
    const taxableNat = Math.max(0, grossAnnual - empDed - social - 480_000)
    const taxableRes = Math.max(0, grossAnnual - empDed - social - 430_000)
    const baseIncomeTax = taxableNat > 0 ? jpIncomeTax(taxableNat) / 1.021 : 0
    const residentIncome = round(taxableRes * 0.1)
    return byCategory([
      ...socialItems,
      {
        key: 'incomeTax',
        label: 'National income tax',
        amount: on(insurance, 'incomeTax') ? round(baseIncomeTax) : 0,
        category: 'tax'
      },
      {
        key: 'incomeSurtax',
        label: 'Reconstruction surtax',
        amount: on(insurance, 'incomeSurtax') ? round(baseIncomeTax * 0.021) : 0,
        category: 'tax'
      },
      {
        key: 'residentIncomeTax',
        label: 'Resident income tax',
        amount: on(insurance, 'residentIncomeTax') ? residentIncome : 0,
        category: 'local'
      },
      {
        key: 'residentPerCapitaTax',
        label: 'Resident per-capita tax',
        amount: on(insurance, 'residentPerCapitaTax') && taxableRes > 0 ? 5_000 : 0,
        category: 'local'
      }
    ])
  }
}

/* -------------------------------- USA -------------------------------- */
const usa: CountryEngine = {
  code: 'US',
  label: 'United States',
  currency: 'USD',
  currencySymbol: '$',
  locale: 'en-US',
  defaultGrossAnnual: 75_000,
  insuranceOptions: [
    { key: 'socialSecurity', label: 'Social Security', hint: '6.2% up to $184.5k' },
    { key: 'medicare', label: 'Medicare', hint: '1.45%' },
    { key: 'additionalMedicare', label: 'Additional Medicare', hint: '0.9% above $200k' },
    { key: 'incomeTax', label: 'Federal income tax', hint: '2026 single brackets' },
    {
      key: 'stateTax',
      label: 'State/local tax estimate',
      hint: 'Varies by state, 4% est.',
      defaultOn: false
    }
  ],
  compute: ({ grossAnnual, insurance }) => {
    const socialItems: DeductionItem[] = [
      {
        key: 'socialSecurity',
        label: 'Social Security',
        amount: on(insurance, 'socialSecurity') ? round(Math.min(grossAnnual, 184_500) * 0.062) : 0,
        category: 'social'
      },
      {
        key: 'medicare',
        label: 'Medicare',
        amount: on(insurance, 'medicare') ? round(grossAnnual * 0.0145) : 0,
        category: 'social'
      },
      {
        key: 'additionalMedicare',
        label: 'Additional Medicare',
        amount: on(insurance, 'additionalMedicare')
          ? round(Math.max(0, grossAnnual - 200_000) * 0.009)
          : 0,
        category: 'social'
      }
    ]

    const taxable = Math.max(0, grossAnnual - 16_100)
    const brackets: Array<[number, number]> = [
      [12_400, 0.1],
      [50_400, 0.12],
      [105_700, 0.22],
      [201_775, 0.24],
      [256_225, 0.32],
      [640_600, 0.35],
      [Infinity, 0.37]
    ]
    let tax = 0
    let prev = 0
    for (const [limit, rate] of brackets) {
      if (taxable > limit) {
        tax += (limit - prev) * rate
        prev = limit
      } else {
        tax += (taxable - prev) * rate
        break
      }
    }
    return byCategory([
      ...socialItems,
      {
        key: 'incomeTax',
        label: 'Federal income tax',
        amount: on(insurance, 'incomeTax') ? round(tax) : 0,
        category: 'tax'
      },
      {
        key: 'stateTax',
        label: 'State/local tax estimate',
        amount: on(insurance, 'stateTax') ? round(Math.max(0, grossAnnual - 16_100) * 0.04) : 0,
        category: 'local'
      }
    ])
  }
}

/* -------------------------------- UK -------------------------------- */
const uk: CountryEngine = {
  code: 'UK',
  label: 'United Kingdom',
  currency: 'GBP',
  currencySymbol: '£',
  locale: 'en-GB',
  defaultGrossAnnual: 35_000,
  insuranceOptions: [
    { key: 'nationalInsurance', label: 'National Insurance', hint: 'Class 1 employee 8% / 2%' },
    { key: 'incomeTax', label: 'PAYE income tax', hint: 'England/Wales/NI bands' },
    { key: 'workplacePension', label: 'Workplace pension', hint: 'Auto-enrol 5%' }
  ],
  compute: ({ grossAnnual, insurance }) => {
    let ni = 0
    if (on(insurance, 'nationalInsurance')) {
      if (grossAnnual > 12_570) ni += Math.min(grossAnnual - 12_570, 50_270 - 12_570) * 0.08
      if (grossAnnual > 50_270) ni += (grossAnnual - 50_270) * 0.02
    }
    const workplacePension = on(insurance, 'workplacePension')
      ? round(Math.max(0, grossAnnual - 6_240) * 0.05)
      : 0

    let allowance = 12_570
    if (grossAnnual > 100_000) allowance = Math.max(0, 12_570 - (grossAnnual - 100_000) / 2)
    const taxable = Math.max(0, grossAnnual - allowance)
    let tax = 0
    const basic = Math.min(taxable, 37_700)
    tax += basic * 0.2
    const higher = Math.min(Math.max(taxable - 37_700, 0), 125_140 - 12_570 - 37_700)
    tax += higher * 0.4
    tax += Math.max(taxable - (125_140 - 12_570), 0) * 0.45
    return byCategory([
      {
        key: 'nationalInsurance',
        label: 'National Insurance',
        amount: round(ni),
        category: 'social'
      },
      {
        key: 'workplacePension',
        label: 'Workplace pension',
        amount: workplacePension,
        category: 'other'
      },
      {
        key: 'incomeTax',
        label: 'PAYE income tax',
        amount: on(insurance, 'incomeTax') ? round(tax) : 0,
        category: 'tax'
      }
    ])
  }
}

/* -------------------------------- Germany (simple) -------------------------------- */
const germany: CountryEngine = {
  code: 'DE',
  label: 'Germany',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'de-DE',
  defaultGrossAnnual: 55_000,
  insuranceOptions: [
    { key: 'health', label: 'Health insurance', hint: '8.55% employee est.' },
    { key: 'care', label: 'Long-term care', hint: '1.8% employee est.' },
    { key: 'pension', label: 'Pension', hint: '9.3%' },
    { key: 'employment', label: 'Unemployment', hint: '1.3%' },
    { key: 'incomeTax', label: 'Income tax', hint: 'Progressive estimate' },
    { key: 'solidarity', label: 'Solidarity surcharge', hint: 'High-income phase-in' },
    { key: 'churchTax', label: 'Church tax', hint: '8% of income tax est.', defaultOn: false }
  ],
  compute: ({ grossAnnual, insurance }) => {
    const healthCap = 69_750
    const pensionCap = 101_400
    const socialItems: DeductionItem[] = [
      {
        key: 'health',
        label: 'Health insurance',
        amount: on(insurance, 'health') ? round(Math.min(grossAnnual, healthCap) * 0.0855) : 0,
        category: 'social'
      },
      {
        key: 'care',
        label: 'Long-term care',
        amount: on(insurance, 'care') ? round(Math.min(grossAnnual, healthCap) * 0.018) : 0,
        category: 'social'
      },
      {
        key: 'pension',
        label: 'Pension insurance',
        amount: on(insurance, 'pension') ? round(Math.min(grossAnnual, pensionCap) * 0.093) : 0,
        category: 'social'
      },
      {
        key: 'employment',
        label: 'Unemployment insurance',
        amount: on(insurance, 'employment') ? round(Math.min(grossAnnual, pensionCap) * 0.013) : 0,
        category: 'social'
      }
    ]
    const social = sum(socialItems, 'social')
    // Very simplified single-filer income tax (Klasse I) approximation.
    const t = Math.max(0, grossAnnual - 11_604 - social)
    let tax = 0
    if (t <= 17_005) tax = t * 0.14 + (t * t) / 250_000
    else if (t <= 66_760) tax = t * 0.24 + (t * t) / 600_000
    else if (t <= 277_825) tax = t * 0.42 - 10_000
    else tax = t * 0.45 - 18_000
    const incomeTax = round(tax)
    const solidarity = incomeTax > 18_130 ? round((incomeTax - 18_130) * 0.055) : 0
    return byCategory([
      ...socialItems,
      {
        key: 'incomeTax',
        label: 'Income tax',
        amount: on(insurance, 'incomeTax') ? incomeTax : 0,
        category: 'tax'
      },
      {
        key: 'solidarity',
        label: 'Solidarity surcharge',
        amount: on(insurance, 'solidarity') ? solidarity : 0,
        category: 'tax'
      },
      {
        key: 'churchTax',
        label: 'Church tax',
        amount: on(insurance, 'churchTax') ? round(incomeTax * 0.08) : 0,
        category: 'local'
      }
    ])
  }
}

export const ENGINES: Record<string, CountryEngine> = {
  JP: japan,
  US: usa,
  UK: uk,
  DE: germany
}

export function defaultInsurance(engine: CountryEngine): Record<InsuranceKey, boolean> {
  const out = {} as Record<InsuranceKey, boolean>
  for (const o of engine.insuranceOptions) out[o.key] = o.defaultOn ?? true
  return out
}

export function calculate(
  countryCode: string,
  amount: number,
  period: Period,
  insurance: Record<InsuranceKey, boolean>
): CalcResult {
  const engine = ENGINES[countryCode] ?? japan
  const grossAnnual = period === 'monthly' ? amount * 12 : amount
  const deductions = engine.compute({ grossAnnual, insurance })
  const total = deductions.items.reduce((acc, item) => acc + item.amount, 0)
  const netAnnual = Math.max(0, grossAnnual - total)
  return {
    grossAnnual,
    grossMonthly: grossAnnual / 12,
    deductions,
    totalDeductions: total,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: grossAnnual > 0 ? total / grossAnnual : 0
  }
}

export function getEngine(code: string): CountryEngine {
  return ENGINES[code] ?? japan
}
