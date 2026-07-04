import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Deliberately a short, curated list, not "every locale" — the sprint asks
// for the localization *structure* (fields + a real settings UI), not a
// full i18n rollout. Extending these lists later doesn't require a schema
// change, just adding entries here.
export const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
] as const;

export const NUMBER_FORMAT_OPTIONS = [
  { value: 'en-US', label: '1,234.56 (US)' },
  { value: 'en-GB', label: '1,234.56 (UK)' },
  { value: 'de-DE', label: '1.234,56 (DE)' },
  { value: 'fr-FR', label: '1 234,56 (FR)' },
] as const;

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
] as const;

const valuesOf = <T extends readonly { value: string }[]>(options: T): string[] => options.map((o) => o.value);

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(valuesOf(LOCALE_OPTIONS))
  locale?: string;

  @IsOptional()
  @IsIn(valuesOf(TIMEZONE_OPTIONS))
  timezone?: string;

  @IsOptional()
  @IsIn(valuesOf(DATE_FORMAT_OPTIONS))
  dateFormat?: string;

  @IsOptional()
  @IsIn(valuesOf(NUMBER_FORMAT_OPTIONS))
  numberFormat?: string;

  @IsOptional()
  @IsIn(valuesOf(CURRENCY_OPTIONS))
  currency?: string;
}
