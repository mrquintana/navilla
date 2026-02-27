import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { JournalEntry } from '../../lib/api';

interface JournalCalendarProps {
  entries: JournalEntry[];
  currentMonth: Date;
  onDayClick: (date: string) => void;
  selectedDate: string | null;
}

/** Pad a number to 2 digits */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Format a Date as "YYYY-MM-DD" */
function toISODate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/**
 * Calendar grid for the journal page.
 * Pure presentational component — receives entries as props, no API calls.
 * Week starts on Monday (ISO / Mexico convention).
 */
export function JournalCalendar({
  entries,
  currentMonth,
  onDayClick,
  selectedDate,
}: JournalCalendarProps) {
  const { t } = useTranslation();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  // Set of "YYYY-MM-DD" strings for days that have at least one entry
  const entryDates = useMemo(() => {
    const dates = new Set<string>();
    for (const entry of entries) {
      // encounterDate is already "YYYY-MM-DD"
      dates.add(entry.encounterDate);
    }
    return dates;
  }, [entries]);

  // Today as "YYYY-MM-DD"
  const today = useMemo(() => {
    const now = new Date();
    return toISODate(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Day abbreviations starting Monday
  const dayNames = useMemo(() => {
    // Use i18n keys if available, otherwise derive from locale
    const keys = [
      'journal.dayMon',
      'journal.dayTue',
      'journal.dayWed',
      'journal.dayThu',
      'journal.dayFri',
      'journal.daySat',
      'journal.daySun',
    ];
    const fallbacks = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return keys.map((key, i) => {
      const translated = t(key);
      // If the key returned itself (no translation), use the fallback
      return translated === key ? fallbacks[i] : translated;
    });
  }, [t]);

  // Build the grid cells for the month
  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Day of week for the 1st: getDay() returns 0=Sun … 6=Sat
    // Convert to Monday-start: Mon=0, Tue=1 … Sun=6
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

    const result: Array<{
      day: number;
      dateStr: string;
      hasEntries: boolean;
      isToday: boolean;
      isEmpty: boolean;
    }> = [];

    // Leading empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({ day: 0, dateStr: '', hasEntries: false, isToday: false, isEmpty: true });
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toISODate(year, month, d);
      result.push({
        day: d,
        dateStr,
        hasEntries: entryDates.has(dateStr),
        isToday: dateStr === today,
        isEmpty: false,
      });
    }

    // Trailing empty cells to fill last row
    const remainder = result.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        result.push({ day: 0, dateStr: '', hasEntries: false, isToday: false, isEmpty: true });
      }
    }

    return result;
  }, [year, month, entryDates, today]);

  return (
    <div className="journal-calendar" role="grid" aria-label={t('journal.calendar')}>
      {/* Header row: day names */}
      {dayNames.map((name) => (
        <div
          key={name}
          className="journal-calendar-header"
          role="columnheader"
          aria-label={name}
        >
          {name}
        </div>
      ))}

      {/* Day cells */}
      {cells.map((cell, index) => {
        if (cell.isEmpty) {
          return (
            <div
              key={`empty-${index}`}
              className="journal-calendar-day journal-calendar-day--empty"
              role="gridcell"
              aria-hidden="true"
            />
          );
        }

        const isSelected = selectedDate === cell.dateStr;

        const classNames = [
          'journal-calendar-day',
          cell.hasEntries ? 'journal-calendar-day--has-entries' : 'journal-calendar-day--no-entries',
          cell.isToday ? 'journal-calendar-day--today' : '',
          isSelected ? 'journal-calendar-day--selected' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div
            key={cell.dateStr}
            className={classNames}
            role="gridcell"
            aria-label={`${cell.day}`}
            aria-selected={isSelected}
            tabIndex={cell.hasEntries ? 0 : -1}
            onClick={cell.hasEntries ? () => onDayClick(cell.dateStr) : undefined}
            onKeyDown={
              cell.hasEntries
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onDayClick(cell.dateStr);
                    }
                  }
                : undefined
            }
          >
            <span className="journal-calendar-day-number">{cell.day}</span>
            {cell.hasEntries && <span className="journal-calendar-dot" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
