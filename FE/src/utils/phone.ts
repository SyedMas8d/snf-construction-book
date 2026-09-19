import { isValidPhoneNumber } from 'libphonenumber-js';
import { Country } from './countries';

export function toE164(country: Country, nationalNumber: string): string {
  const digits = nationalNumber.replace(/[^0-9]/g, '');
  return digits ? `+${country.dialCode}${digits}` : '';
}

export function isValidPhone(country: Country, nationalNumber: string): boolean {
  const digits = nationalNumber.replace(/[^0-9]/g, '');
  if (!digits) return false;
  try {
    return isValidPhoneNumber(toE164(country, nationalNumber), country.iso2 as never);
  } catch {
    return false;
  }
}
