import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface CountryData {
  name: string;
  flag: string;
  callingCode: string;
}

const COUNTRIES: CountryData[] = [
  // Priority countries
  { name: 'Mexico', flag: '🇲🇽', callingCode: '52' },
  { name: 'United States', flag: '🇺🇸', callingCode: '1' },
  // Alphabetical
  { name: 'Argentina', flag: '🇦🇷', callingCode: '54' },
  { name: 'Australia', flag: '🇦🇺', callingCode: '61' },
  { name: 'Belgium', flag: '🇧🇪', callingCode: '32' },
  { name: 'Bolivia', flag: '🇧🇴', callingCode: '591' },
  { name: 'Brazil', flag: '🇧🇷', callingCode: '55' },
  { name: 'Canada', flag: '🇨🇦', callingCode: '1' },
  { name: 'Chile', flag: '🇨🇱', callingCode: '56' },
  { name: 'China', flag: '🇨🇳', callingCode: '86' },
  { name: 'Colombia', flag: '🇨🇴', callingCode: '57' },
  { name: 'Costa Rica', flag: '🇨🇷', callingCode: '506' },
  { name: 'Cuba', flag: '🇨🇺', callingCode: '53' },
  { name: 'Dominican Republic', flag: '🇩🇴', callingCode: '1' },
  { name: 'Ecuador', flag: '🇪🇨', callingCode: '593' },
  { name: 'El Salvador', flag: '🇸🇻', callingCode: '503' },
  { name: 'France', flag: '🇫🇷', callingCode: '33' },
  { name: 'Germany', flag: '🇩🇪', callingCode: '49' },
  { name: 'Guatemala', flag: '🇬🇹', callingCode: '502' },
  { name: 'Honduras', flag: '🇭🇳', callingCode: '504' },
  { name: 'India', flag: '🇮🇳', callingCode: '91' },
  { name: 'Italy', flag: '🇮🇹', callingCode: '39' },
  { name: 'Jamaica', flag: '🇯🇲', callingCode: '1' },
  { name: 'Japan', flag: '🇯🇵', callingCode: '81' },
  { name: 'Nicaragua', flag: '🇳🇮', callingCode: '505' },
  { name: 'Panama', flag: '🇵🇦', callingCode: '507' },
  { name: 'Paraguay', flag: '🇵🇾', callingCode: '595' },
  { name: 'Peru', flag: '🇵🇪', callingCode: '51' },
  { name: 'Philippines', flag: '🇵🇭', callingCode: '63' },
  { name: 'Portugal', flag: '🇵🇹', callingCode: '351' },
  { name: 'Puerto Rico', flag: '🇵🇷', callingCode: '1' },
  { name: 'South Korea', flag: '🇰🇷', callingCode: '82' },
  { name: 'Spain', flag: '🇪🇸', callingCode: '34' },
  { name: 'United Kingdom', flag: '🇬🇧', callingCode: '44' },
  { name: 'Uruguay', flag: '🇺🇾', callingCode: '598' },
  { name: 'Venezuela', flag: '🇻🇪', callingCode: '58' },
];

interface CountryCodePickerProps {
  value: string | null;
  onChange: (code: string | null) => void;
}

export function CountryCodePicker({ value, onChange }: CountryCodePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = value
    ? COUNTRIES.find((c) => c.callingCode === value && c.name !== 'Canada')
      ?? COUNTRIES.find((c) => c.callingCode === value)
    : null;

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.callingCode.includes(search),
      )
    : COUNTRIES;

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input flex items-center gap-1 whitespace-nowrap px-2 text-sm min-w-[100px]"
      >
        {selected ? (
          <>
            <span>{selected.flag}</span>
            <span>+{selected.callingCode}</span>
          </>
        ) : (
          <span className="text-muted text-xs">
            {t('journal.countryCodePlaceholder')}
          </span>
        )}
        <ChevronDown className="w-3 h-3 ml-auto text-muted" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border bg-white shadow-lg"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
            <input
              ref={searchRef}
              type="text"
              className="input w-full text-sm"
              placeholder={t('journal.countryCodePlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-muted hover:bg-stone-50 border-b"
                style={{ borderColor: 'var(--color-border-light)' }}
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setSearch('');
                }}
              >
                {t('journal.countryCodeHint')}
              </button>
            )}
            {filtered.map((country, i) => (
              <button
                key={`${country.callingCode}-${country.name}-${i}`}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center gap-2 ${
                  value === country.callingCode ? 'bg-indigo-50' : ''
                }`}
                onClick={() => {
                  onChange(country.callingCode);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <span>{country.flag}</span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className="text-muted text-xs">+{country.callingCode}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted text-center">
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
