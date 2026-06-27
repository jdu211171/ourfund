import { AppSeed, SalaryCalculatorSettings } from '../../types';
import { defaultSalaryCalculatorSettings, emptySeed, cloneSeed } from './defaults';

export function normalizeSalaryCalculatorSettings(value: unknown): SalaryCalculatorSettings {
  const settings = 
    value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<SalaryCalculatorSettings>)
    : {};
  
  const rawInsurance = settings.insurance;
  const insurance = 
    rawInsurance && typeof rawInsurance === "object" && !Array.isArray(rawInsurance)
    ? (Object.fromEntries(
        Object.entries(rawInsurance).filter(([_, enabled]) => typeof enabled === "boolean"),
      ) as Record<string, boolean>)
    : {};
  
  const amount =
    typeof settings.amount === "number" && Number.isFinite(settings.amount)
      ? Math.max(0, settings.amount)
      : null;
      
  return {
    ...defaultSalaryCalculatorSettings,
    country:
      typeof settings.country === "string" && settings.country.trim()
        ? settings.country
        : defaultSalaryCalculatorSettings.country,
    period: settings.period === "annual" ? "annual" : "monthly",
    amount,
    insurance,
  };
}

export function normalizeSeed(seed: Partial<AppSeed>): AppSeed {
  return {
    ...cloneSeed(emptySeed),
    ...seed,
    reportPeriod: seed.reportPeriod ?? emptySeed.reportPeriod,
    salaryCalculatorSettings: normalizeSalaryCalculatorSettings(seed.salaryCalculatorSettings),
    profile: { ...emptySeed.profile, ...seed.profile },
    currencies: { ...emptySeed.currencies, ...seed.currencies },
    notificationPrefs: { ...emptySeed.notificationPrefs, ...seed.notificationPrefs },
    historyFilters: { ...emptySeed.historyFilters, ...seed.historyFilters },
  };
}
