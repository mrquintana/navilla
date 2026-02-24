/**
 * Geolocation utilities for detecting user location
 */

interface GeoLocation {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
}

/**
 * Maps IANA timezone to a country code for common cases.
 * Only covers zones that unambiguously map to a single country.
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'America/Mexico_City': 'MX',
  'America/Monterrey': 'MX',
  'America/Merida': 'MX',
  'America/Cancun': 'MX',
  'America/Chihuahua': 'MX',
  'America/Hermosillo': 'MX',
  'America/Mazatlan': 'MX',
  'America/Tijuana': 'MX',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Bogota': 'CO',
  'America/Santiago': 'CL',
  'America/Lima': 'PE',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR',
  'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH',
  'Europe/Dublin': 'IE',
  'Europe/Warsaw': 'PL',
  'Europe/Istanbul': 'TR',
  'Europe/Moscow': 'RU',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Jerusalem': 'IL',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Kolkata': 'IN',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH',
  'Asia/Manila': 'PH',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jakarta': 'ID',
  'Asia/Ho_Chi_Minh': 'VN',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Cairo': 'EG',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',
};

/**
 * Detect user's likely country from browser locale and timezone.
 * No network request — uses navigator.language and Intl APIs only.
 */
export function detectCountry(): GeoLocation | null {
  try {
    // 1. Try timezone first — more precise than locale for location
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return { country: '', countryCode: TIMEZONE_TO_COUNTRY[tz] };
    }

    // 2. Fall back to browser locale (e.g. "es-MX" → "MX", "en-US" → "US")
    const lang = navigator.language || '';
    const parts = lang.split('-');
    if (parts.length >= 2) {
      const code = parts[parts.length - 1].toUpperCase();
      if (code.length === 2) {
        return { country: '', countryCode: code };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * List of countries for dropdown
 */
export const countries = [
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Turkey' },
  { code: 'PL', name: 'Poland' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'VN', name: 'Vietnam' },
].sort((a, b) => a.name.localeCompare(b.name));
