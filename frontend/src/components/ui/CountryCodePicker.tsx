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
  { name: 'Afghanistan', flag: '🇦🇫', callingCode: '93' },
  { name: 'Albania', flag: '🇦🇱', callingCode: '355' },
  { name: 'Algeria', flag: '🇩🇿', callingCode: '213' },
  { name: 'Andorra', flag: '🇦🇩', callingCode: '376' },
  { name: 'Angola', flag: '🇦🇴', callingCode: '244' },
  { name: 'Antigua and Barbuda', flag: '🇦🇬', callingCode: '1' },
  { name: 'Argentina', flag: '🇦🇷', callingCode: '54' },
  { name: 'Armenia', flag: '🇦🇲', callingCode: '374' },
  { name: 'Australia', flag: '🇦🇺', callingCode: '61' },
  { name: 'Austria', flag: '🇦🇹', callingCode: '43' },
  { name: 'Azerbaijan', flag: '🇦🇿', callingCode: '994' },
  { name: 'Bahamas', flag: '🇧🇸', callingCode: '1' },
  { name: 'Bahrain', flag: '🇧🇭', callingCode: '973' },
  { name: 'Bangladesh', flag: '🇧🇩', callingCode: '880' },
  { name: 'Barbados', flag: '🇧🇧', callingCode: '1' },
  { name: 'Belarus', flag: '🇧🇾', callingCode: '375' },
  { name: 'Belgium', flag: '🇧🇪', callingCode: '32' },
  { name: 'Belize', flag: '🇧🇿', callingCode: '501' },
  { name: 'Benin', flag: '🇧🇯', callingCode: '229' },
  { name: 'Bhutan', flag: '🇧🇹', callingCode: '975' },
  { name: 'Bolivia', flag: '🇧🇴', callingCode: '591' },
  { name: 'Bosnia and Herzegovina', flag: '🇧🇦', callingCode: '387' },
  { name: 'Botswana', flag: '🇧🇼', callingCode: '267' },
  { name: 'Brazil', flag: '🇧🇷', callingCode: '55' },
  { name: 'Brunei', flag: '🇧🇳', callingCode: '673' },
  { name: 'Bulgaria', flag: '🇧🇬', callingCode: '359' },
  { name: 'Burkina Faso', flag: '🇧🇫', callingCode: '226' },
  { name: 'Burundi', flag: '🇧🇮', callingCode: '257' },
  { name: 'Cabo Verde', flag: '🇨🇻', callingCode: '238' },
  { name: 'Cambodia', flag: '🇰🇭', callingCode: '855' },
  { name: 'Cameroon', flag: '🇨🇲', callingCode: '237' },
  { name: 'Canada', flag: '🇨🇦', callingCode: '1' },
  { name: 'Central African Republic', flag: '🇨🇫', callingCode: '236' },
  { name: 'Chad', flag: '🇹🇩', callingCode: '235' },
  { name: 'Chile', flag: '🇨🇱', callingCode: '56' },
  { name: 'China', flag: '🇨🇳', callingCode: '86' },
  { name: 'Colombia', flag: '🇨🇴', callingCode: '57' },
  { name: 'Comoros', flag: '🇰🇲', callingCode: '269' },
  { name: 'Congo (DRC)', flag: '🇨🇩', callingCode: '243' },
  { name: 'Congo (Republic)', flag: '🇨🇬', callingCode: '242' },
  { name: 'Costa Rica', flag: '🇨🇷', callingCode: '506' },
  { name: 'Croatia', flag: '🇭🇷', callingCode: '385' },
  { name: 'Cuba', flag: '🇨🇺', callingCode: '53' },
  { name: 'Cyprus', flag: '🇨🇾', callingCode: '357' },
  { name: 'Czech Republic', flag: '🇨🇿', callingCode: '420' },
  { name: 'Denmark', flag: '🇩🇰', callingCode: '45' },
  { name: 'Djibouti', flag: '🇩🇯', callingCode: '253' },
  { name: 'Dominica', flag: '🇩🇲', callingCode: '1' },
  { name: 'Dominican Republic', flag: '🇩🇴', callingCode: '1' },
  { name: 'Ecuador', flag: '🇪🇨', callingCode: '593' },
  { name: 'Egypt', flag: '🇪🇬', callingCode: '20' },
  { name: 'El Salvador', flag: '🇸🇻', callingCode: '503' },
  { name: 'Equatorial Guinea', flag: '🇬🇶', callingCode: '240' },
  { name: 'Eritrea', flag: '🇪🇷', callingCode: '291' },
  { name: 'Estonia', flag: '🇪🇪', callingCode: '372' },
  { name: 'Eswatini', flag: '🇸🇿', callingCode: '268' },
  { name: 'Ethiopia', flag: '🇪🇹', callingCode: '251' },
  { name: 'Fiji', flag: '🇫🇯', callingCode: '679' },
  { name: 'Finland', flag: '🇫🇮', callingCode: '358' },
  { name: 'France', flag: '🇫🇷', callingCode: '33' },
  { name: 'Gabon', flag: '🇬🇦', callingCode: '241' },
  { name: 'Gambia', flag: '🇬🇲', callingCode: '220' },
  { name: 'Georgia', flag: '🇬🇪', callingCode: '995' },
  { name: 'Germany', flag: '🇩🇪', callingCode: '49' },
  { name: 'Ghana', flag: '🇬🇭', callingCode: '233' },
  { name: 'Greece', flag: '🇬🇷', callingCode: '30' },
  { name: 'Grenada', flag: '🇬🇩', callingCode: '1' },
  { name: 'Guatemala', flag: '🇬🇹', callingCode: '502' },
  { name: 'Guinea', flag: '🇬🇳', callingCode: '224' },
  { name: 'Guinea-Bissau', flag: '🇬🇼', callingCode: '245' },
  { name: 'Guyana', flag: '🇬🇾', callingCode: '592' },
  { name: 'Haiti', flag: '🇭🇹', callingCode: '509' },
  { name: 'Honduras', flag: '🇭🇳', callingCode: '504' },
  { name: 'Hungary', flag: '🇭🇺', callingCode: '36' },
  { name: 'Iceland', flag: '🇮🇸', callingCode: '354' },
  { name: 'India', flag: '🇮🇳', callingCode: '91' },
  { name: 'Indonesia', flag: '🇮🇩', callingCode: '62' },
  { name: 'Iran', flag: '🇮🇷', callingCode: '98' },
  { name: 'Iraq', flag: '🇮🇶', callingCode: '964' },
  { name: 'Ireland', flag: '🇮🇪', callingCode: '353' },
  { name: 'Israel', flag: '🇮🇱', callingCode: '972' },
  { name: 'Italy', flag: '🇮🇹', callingCode: '39' },
  { name: 'Ivory Coast', flag: '🇨🇮', callingCode: '225' },
  { name: 'Jamaica', flag: '🇯🇲', callingCode: '1' },
  { name: 'Japan', flag: '🇯🇵', callingCode: '81' },
  { name: 'Jordan', flag: '🇯🇴', callingCode: '962' },
  { name: 'Kazakhstan', flag: '🇰🇿', callingCode: '7' },
  { name: 'Kenya', flag: '🇰🇪', callingCode: '254' },
  { name: 'Kiribati', flag: '🇰🇮', callingCode: '686' },
  { name: 'Kuwait', flag: '🇰🇼', callingCode: '965' },
  { name: 'Kyrgyzstan', flag: '🇰🇬', callingCode: '996' },
  { name: 'Laos', flag: '🇱🇦', callingCode: '856' },
  { name: 'Latvia', flag: '🇱🇻', callingCode: '371' },
  { name: 'Lebanon', flag: '🇱🇧', callingCode: '961' },
  { name: 'Lesotho', flag: '🇱🇸', callingCode: '266' },
  { name: 'Liberia', flag: '🇱🇷', callingCode: '231' },
  { name: 'Libya', flag: '🇱🇾', callingCode: '218' },
  { name: 'Liechtenstein', flag: '🇱🇮', callingCode: '423' },
  { name: 'Lithuania', flag: '🇱🇹', callingCode: '370' },
  { name: 'Luxembourg', flag: '🇱🇺', callingCode: '352' },
  { name: 'Madagascar', flag: '🇲🇬', callingCode: '261' },
  { name: 'Malawi', flag: '🇲🇼', callingCode: '265' },
  { name: 'Malaysia', flag: '🇲🇾', callingCode: '60' },
  { name: 'Maldives', flag: '🇲🇻', callingCode: '960' },
  { name: 'Mali', flag: '🇲🇱', callingCode: '223' },
  { name: 'Malta', flag: '🇲🇹', callingCode: '356' },
  { name: 'Marshall Islands', flag: '🇲🇭', callingCode: '692' },
  { name: 'Mauritania', flag: '🇲🇷', callingCode: '222' },
  { name: 'Mauritius', flag: '🇲🇺', callingCode: '230' },
  { name: 'Micronesia', flag: '🇫🇲', callingCode: '691' },
  { name: 'Moldova', flag: '🇲🇩', callingCode: '373' },
  { name: 'Monaco', flag: '🇲🇨', callingCode: '377' },
  { name: 'Mongolia', flag: '🇲🇳', callingCode: '976' },
  { name: 'Montenegro', flag: '🇲🇪', callingCode: '382' },
  { name: 'Morocco', flag: '🇲🇦', callingCode: '212' },
  { name: 'Mozambique', flag: '🇲🇿', callingCode: '258' },
  { name: 'Myanmar', flag: '🇲🇲', callingCode: '95' },
  { name: 'Namibia', flag: '🇳🇦', callingCode: '264' },
  { name: 'Nauru', flag: '🇳🇷', callingCode: '674' },
  { name: 'Nepal', flag: '🇳🇵', callingCode: '977' },
  { name: 'Netherlands', flag: '🇳🇱', callingCode: '31' },
  { name: 'New Zealand', flag: '🇳🇿', callingCode: '64' },
  { name: 'Nicaragua', flag: '🇳🇮', callingCode: '505' },
  { name: 'Niger', flag: '🇳🇪', callingCode: '227' },
  { name: 'Nigeria', flag: '🇳🇬', callingCode: '234' },
  { name: 'North Korea', flag: '🇰🇵', callingCode: '850' },
  { name: 'North Macedonia', flag: '🇲🇰', callingCode: '389' },
  { name: 'Norway', flag: '🇳🇴', callingCode: '47' },
  { name: 'Oman', flag: '🇴🇲', callingCode: '968' },
  { name: 'Pakistan', flag: '🇵🇰', callingCode: '92' },
  { name: 'Palau', flag: '🇵🇼', callingCode: '680' },
  { name: 'Palestine', flag: '🇵🇸', callingCode: '970' },
  { name: 'Panama', flag: '🇵🇦', callingCode: '507' },
  { name: 'Papua New Guinea', flag: '🇵🇬', callingCode: '675' },
  { name: 'Paraguay', flag: '🇵🇾', callingCode: '595' },
  { name: 'Peru', flag: '🇵🇪', callingCode: '51' },
  { name: 'Philippines', flag: '🇵🇭', callingCode: '63' },
  { name: 'Poland', flag: '🇵🇱', callingCode: '48' },
  { name: 'Portugal', flag: '🇵🇹', callingCode: '351' },
  { name: 'Puerto Rico', flag: '🇵🇷', callingCode: '1' },
  { name: 'Qatar', flag: '🇶🇦', callingCode: '974' },
  { name: 'Romania', flag: '🇷🇴', callingCode: '40' },
  { name: 'Russia', flag: '🇷🇺', callingCode: '7' },
  { name: 'Rwanda', flag: '🇷🇼', callingCode: '250' },
  { name: 'Saint Kitts and Nevis', flag: '🇰🇳', callingCode: '1' },
  { name: 'Saint Lucia', flag: '🇱🇨', callingCode: '1' },
  { name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', callingCode: '1' },
  { name: 'Samoa', flag: '🇼🇸', callingCode: '685' },
  { name: 'San Marino', flag: '🇸🇲', callingCode: '378' },
  { name: 'Sao Tome and Principe', flag: '🇸🇹', callingCode: '239' },
  { name: 'Saudi Arabia', flag: '🇸🇦', callingCode: '966' },
  { name: 'Senegal', flag: '🇸🇳', callingCode: '221' },
  { name: 'Serbia', flag: '🇷🇸', callingCode: '381' },
  { name: 'Seychelles', flag: '🇸🇨', callingCode: '248' },
  { name: 'Sierra Leone', flag: '🇸🇱', callingCode: '232' },
  { name: 'Singapore', flag: '🇸🇬', callingCode: '65' },
  { name: 'Slovakia', flag: '🇸🇰', callingCode: '421' },
  { name: 'Slovenia', flag: '🇸🇮', callingCode: '386' },
  { name: 'Solomon Islands', flag: '🇸🇧', callingCode: '677' },
  { name: 'Somalia', flag: '🇸🇴', callingCode: '252' },
  { name: 'South Africa', flag: '🇿🇦', callingCode: '27' },
  { name: 'South Korea', flag: '🇰🇷', callingCode: '82' },
  { name: 'South Sudan', flag: '🇸🇸', callingCode: '211' },
  { name: 'Spain', flag: '🇪🇸', callingCode: '34' },
  { name: 'Sri Lanka', flag: '🇱🇰', callingCode: '94' },
  { name: 'Sudan', flag: '🇸🇩', callingCode: '249' },
  { name: 'Suriname', flag: '🇸🇷', callingCode: '597' },
  { name: 'Sweden', flag: '🇸🇪', callingCode: '46' },
  { name: 'Switzerland', flag: '🇨🇭', callingCode: '41' },
  { name: 'Syria', flag: '🇸🇾', callingCode: '963' },
  { name: 'Taiwan', flag: '🇹🇼', callingCode: '886' },
  { name: 'Tajikistan', flag: '🇹🇯', callingCode: '992' },
  { name: 'Tanzania', flag: '🇹🇿', callingCode: '255' },
  { name: 'Thailand', flag: '🇹🇭', callingCode: '66' },
  { name: 'Timor-Leste', flag: '🇹🇱', callingCode: '670' },
  { name: 'Togo', flag: '🇹🇬', callingCode: '228' },
  { name: 'Tonga', flag: '🇹🇴', callingCode: '676' },
  { name: 'Trinidad and Tobago', flag: '🇹🇹', callingCode: '1' },
  { name: 'Tunisia', flag: '🇹🇳', callingCode: '216' },
  { name: 'Turkey', flag: '🇹🇷', callingCode: '90' },
  { name: 'Turkmenistan', flag: '🇹🇲', callingCode: '993' },
  { name: 'Tuvalu', flag: '🇹🇻', callingCode: '688' },
  { name: 'Uganda', flag: '🇺🇬', callingCode: '256' },
  { name: 'Ukraine', flag: '🇺🇦', callingCode: '380' },
  { name: 'United Arab Emirates', flag: '🇦🇪', callingCode: '971' },
  { name: 'United Kingdom', flag: '🇬🇧', callingCode: '44' },
  { name: 'Uruguay', flag: '🇺🇾', callingCode: '598' },
  { name: 'Uzbekistan', flag: '🇺🇿', callingCode: '998' },
  { name: 'Vanuatu', flag: '🇻🇺', callingCode: '678' },
  { name: 'Vatican City', flag: '🇻🇦', callingCode: '39' },
  { name: 'Venezuela', flag: '🇻🇪', callingCode: '58' },
  { name: 'Vietnam', flag: '🇻🇳', callingCode: '84' },
  { name: 'Yemen', flag: '🇾🇪', callingCode: '967' },
  { name: 'Zambia', flag: '🇿🇲', callingCode: '260' },
  { name: 'Zimbabwe', flag: '🇿🇼', callingCode: '263' },
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
