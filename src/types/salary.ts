import { SalaryCalculationPeriod } from './core';

export interface SalaryCalculatorSettings {
  country: string;
  period: SalaryCalculationPeriod;
  amount: number | null;
  insurance: Record<string, boolean>;
}
