import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface MonthYearPickerProps {
  currentMonth: Date;
  monthsWithEntries: string[];
  onNavigate: (year: number, month: number) => void;
  label: string;
}

type PickerView = 'year' | 'month';

export function MonthYearPicker({ currentMonth, monthsWithEntries, onNavigate, label }: MonthYearPickerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.replace('_', '-');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>('year');
  const [selectedYear, setSelectedYear] = useState(currentMonth.getFullYear());
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    for (const m of monthsWithEntries) {
      years.add(parseInt(m.slice(0, 4), 10));
    }
    return [...years].sort((a, b) => b - a);
  }, [monthsWithEntries, currentYear]);

  const monthsInYear = useMemo(() => {
    const set = new Set<number>();
    for (const m of monthsWithEntries) {
      if (m.startsWith(`${selectedYear}-`)) {
        set.add(parseInt(m.slice(5, 7), 10));
      }
    }
    return set;
  }, [monthsWithEntries, selectedYear]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleOpen = () => {
    setSelectedYear(currentMonth.getFullYear());
    setView('year');
    setOpen(true);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setView('month');
  };

  const handleMonthSelect = (monthIndex: number) => {
    onNavigate(selectedYear, monthIndex);
    setOpen(false);
  };

  const getMonthAbbr = useCallback((monthIndex: number) => {
    const d = new Date(2026, monthIndex, 1);
    return d.toLocaleDateString(locale, { month: 'short' });
  }, [locale]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        className="journal-month-nav-label cursor-pointer inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
        onClick={handleOpen}
        aria-label={t('journal.selectMonth')}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-stone-200 rounded-xl shadow-lg p-3 min-w-[220px]">
          {view === 'year' ? (
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2 text-center">
                {t('journal.selectYear')}
              </p>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      year === currentMonth.getFullYear()
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-stone-100 text-stone-700'
                    }`}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2 transition-colors"
                onClick={() => setView('year')}
              >
                {selectedYear}
              </button>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = i + 1;
                  const hasEntries = monthsInYear.has(monthNum);
                  const isCurrent =
                    selectedYear === currentMonth.getFullYear() &&
                    i === currentMonth.getMonth();

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!hasEntries && !isCurrent}
                      className={`px-2 py-1.5 rounded-lg text-sm transition-colors ${
                        isCurrent
                          ? 'bg-indigo-100 text-indigo-700 font-medium'
                          : hasEntries
                            ? 'text-stone-700 hover:bg-stone-100 cursor-pointer'
                            : 'text-stone-300 cursor-not-allowed'
                      }`}
                      onClick={() => handleMonthSelect(i)}
                    >
                      {getMonthAbbr(i)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
