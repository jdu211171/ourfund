import { CurrencyCode } from "./core";

export interface Profile {
  name: string;
  email: string;
  phone: string;
  pronouns: string;
  initials: string;
}

export interface CurrencySettings {
  personal: CurrencyCode;
  family: CurrencyCode;
}
