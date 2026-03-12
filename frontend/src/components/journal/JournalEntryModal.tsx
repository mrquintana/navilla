import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Bookmark, Unlink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../hooks/useUser';
import {
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useJournalTemplates,
  useSaveJournalTemplates,
  useJournalPartners,
  useRecentAliases,
} from '../../hooks/useJournal';
import { api } from '../../lib/api';
import type { JournalEntry, CustomField, Connection } from '../../lib/api';
import { CountryCodePicker } from '../ui/CountryCodePicker';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry | null; // null = create mode, defined = edit mode
  onPromote?: (alias: string) => void;
}

interface CustomFieldState {
  label: string;
  value: string;
  saveForFuture: boolean;
}

/** Union type for partner chips — either a saved partner or a recent alias */
interface PartnerSuggestion {
  type: 'partner' | 'alias';
  id: string | null; // partner id for saved partners, null for aliases
  alias: string;
  connectionId: string | null;
}

const MAX_CUSTOM_FIELDS = 3;
const MAX_CHIPS = 8;

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function buildInitialCustomFields(
  entry: JournalEntry | null,
  savedLabels: string[]
): CustomFieldState[] {
  if (entry) {
    return (entry.customFields ?? []).map((cf: CustomField) => ({
      label: cf.label,
      value: cf.value,
      saveForFuture: false,
    }));
  }
  return savedLabels.slice(0, MAX_CUSTOM_FIELDS).map((label) => ({
    label,
    value: '',
    saveForFuture: false,
  }));
}

export function JournalEntryModal({ isOpen, onClose, entry, onPromote }: JournalEntryModalProps) {
  const { session } = useAuth();
  const { data: userProfile } = useUser();
  const { data: templates } = useJournalTemplates();

  const connectionsQuery = useQuery({
    queryKey: ['connections', 'confirmed'],
    queryFn: () => api.connections.confirmed(session!.access_token),
    enabled: isOpen && !!session?.access_token,
  });

  const savedLabels = useMemo(() => templates?.labels ?? [], [templates?.labels]);

  // Use a key to reset the inner form when modal opens with different entry
  // This avoids calling setState in useEffect
  const formKey = isOpen ? `${entry?.id ?? 'new'}-${entry?.updatedAt ?? ''}` : 'closed';

  if (!isOpen) return null;

  return (
    <JournalEntryForm
      key={formKey}
      entry={entry}
      onClose={onClose}
      savedLabels={savedLabels}
      connections={connectionsQuery.data ?? []}
      onPromote={onPromote}
      dateOfBirth={userProfile?.dateOfBirth}
    />
  );
}

interface JournalEntryFormProps {
  entry: JournalEntry | null;
  onClose: () => void;
  savedLabels: string[];
  connections: Connection[];
  onPromote?: (alias: string) => void;
  dateOfBirth?: string;
}

function JournalEntryForm({
  entry,
  onClose,
  savedLabels,
  connections,
  onPromote,
  dateOfBirth,
}: JournalEntryFormProps) {
  const { t } = useTranslation();

  // Mutations
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const templatesMutation = useSaveJournalTemplates();

  // Partner data
  const { data: partners } = useJournalPartners();
  const { data: recentAliases } = useRecentAliases();

  const isEditMode = entry !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form state — initialized from props (no useEffect needed thanks to key-based reset)
  const [formDate, setFormDate] = useState(entry?.encounterDate ?? todayISO());
  const [formAlias, setFormAlias] = useState(entry?.partnerAlias ?? '');
  const [formConnectionId, setFormConnectionId] = useState<string>(entry?.connectionId ?? '');
  const [formPartnerId, setFormPartnerId] = useState<string | null>(entry?.partnerId ?? null);
  const [formPhone, setFormPhone] = useState('');
  const [formCountryCode, setFormCountryCode] = useState<string | null>(null);
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [formNotes, setFormNotes] = useState(entry?.notes ?? '');
  const [customFields, setCustomFields] = useState<CustomFieldState[]>(
    () => buildInitialCustomFields(entry, savedLabels)
  );
  const [formEncounterTypes, setFormEncounterTypes] = useState<string[]>(entry?.encounterTypes ?? []);
  const [formProtectionMethods, setFormProtectionMethods] = useState<string[]>(entry?.protectionMethods ?? []);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const aliasInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setFormPhone('');
      setPhoneHint(null);
      return;
    }
    if (raw.includes('+')) {
      setPhoneHint(t('journal.phoneCountryCodeHint'));
      return;
    }
    if (/[^0-9]/.test(raw)) {
      setPhoneHint(t('journal.phoneDigitsOnly'));
      return;
    }
    setPhoneHint(null);
    setFormPhone(raw);
  }, [t]);

  // Build the combined suggestion list (saved partners + recent aliases, deduplicated)
  const allSuggestions = useMemo((): PartnerSuggestion[] => {
    const suggestions: PartnerSuggestion[] = [];
    const seenAliases = new Set<string>();

    // Saved partners first
    for (const p of partners ?? []) {
      const lower = p.alias.toLowerCase();
      if (!seenAliases.has(lower)) {
        seenAliases.add(lower);
        suggestions.push({
          type: 'partner',
          id: p.id,
          alias: p.alias,
          connectionId: p.connectionId,
        });
      }
    }

    // Then recent aliases (excluding those already covered by saved partners)
    for (const alias of recentAliases ?? []) {
      const lower = alias.toLowerCase();
      if (!seenAliases.has(lower)) {
        seenAliases.add(lower);
        suggestions.push({
          type: 'alias',
          id: null,
          alias,
          connectionId: null,
        });
      }
    }

    return suggestions;
  }, [partners, recentAliases]);

  // Top 8 for chips
  const chipSuggestions = useMemo(
    () => allSuggestions.slice(0, MAX_CHIPS),
    [allSuggestions]
  );

  // Filtered suggestions for autocomplete dropdown
  const filteredSuggestions = useMemo(() => {
    if (!formAlias.trim()) return [];
    const query = formAlias.toLowerCase();
    return allSuggestions.filter((s) => s.alias.toLowerCase().includes(query));
  }, [allSuggestions, formAlias]);

  // Close on Escape key — dismiss autocomplete first, then the modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
          setIsTyping(false);
          setHighlightedIndex(-1);
        } else {
          onClose();
        }
      }
    },
    [onClose, showSuggestions]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        aliasInputRef.current &&
        !aliasInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setIsTyping(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Partner selection handler (from chip or autocomplete)
  const selectPartner = (suggestion: PartnerSuggestion) => {
    setFormAlias(suggestion.alias);
    if (suggestion.type === 'partner' && suggestion.id) {
      setFormPartnerId(suggestion.id);
      // Connection lives on the partner — set it and hide the dropdown
      if (suggestion.connectionId) {
        setFormConnectionId(suggestion.connectionId);
      } else {
        setFormConnectionId('');
      }
    } else {
      setFormPartnerId(null);
    }
    setShowSuggestions(false);
    setIsTyping(false);
    setHighlightedIndex(-1);
  };

  // Clear partner selection
  const clearPartner = () => {
    setFormPartnerId(null);
    setFormAlias('');
    setFormConnectionId('');
    setIsTyping(false);
    aliasInputRef.current?.focus();
  };

  // Custom fields handlers
  const addCustomField = () => {
    if (customFields.length >= MAX_CUSTOM_FIELDS) return;
    setCustomFields((prev) => [...prev, { label: '', value: '', saveForFuture: false }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: Partial<CustomFieldState>) => {
    setCustomFields((prev) =>
      prev.map((cf, i) => (i === index ? { ...cf, ...field } : cf))
    );
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formDate.trim()) {
      setError(t('journal.dateRequired'));
      return;
    }
    if (dateOfBirth && formDate < dateOfBirth) {
      setError(t('journal.dateBeforeDob'));
      return;
    }
    if (formDate > todayISO()) {
      setError(t('journal.dateInFuture'));
      return;
    }

    // Build custom fields (only include non-empty ones)
    const filteredCustomFields: CustomField[] = customFields
      .filter((cf) => cf.label.trim() && cf.value.trim())
      .map((cf) => ({ label: cf.label.trim(), value: cf.value.trim() }));

    const alias = formAlias.trim() || undefined;

    const data = {
      encounterDate: formDate,
      partnerAlias: alias,
      connectionId: formConnectionId || undefined,
      partnerId: formPartnerId || undefined,
      phone: formPhone.trim() || undefined,
      countryCode: formCountryCode || undefined,
      notes: formNotes.trim() || undefined,
      customFields: filteredCustomFields.length > 0 ? filteredCustomFields : undefined,
      encounterTypes: formEncounterTypes.length > 0 ? formEncounterTypes : undefined,
      protectionMethods: formProtectionMethods.length > 0 ? formProtectionMethods : undefined,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: entry.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }

      // Save templates if any "save for future" checkboxes are checked
      const newLabelsToSave = customFields
        .filter((cf) => cf.saveForFuture && cf.label.trim())
        .map((cf) => cf.label.trim());

      if (newLabelsToSave.length > 0) {
        const combined = [...new Set([...savedLabels, ...newLabelsToSave])].slice(
          0,
          MAX_CUSTOM_FIELDS
        );
        await templatesMutation.mutateAsync(combined);
      }

      // Check for promotion prompt (only on create, only if no partner was selected)
      if (!isEditMode && !formPartnerId && alias && onPromote) {
        onPromote(alias);
      }

      onClose();
    } catch {
      setError(t('journal.saveFailed'));
    }
  };

  // Should we show the autocomplete dropdown?
  const shouldShowDropdown =
    showSuggestions &&
    isTyping &&
    !formPartnerId &&
    filteredSuggestions.length > 0;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="modal" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">
            {isEditMode ? t('journal.editEntry') : t('journal.addEntry')}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Encounter date */}
          <div>
            <label className="label" htmlFor="journal-date">
              {t('journal.encounterDate')}
            </label>
            <input
              id="journal-date"
              type="date"
              className="input"
              value={formDate}
              min={dateOfBirth || undefined}
              max={todayISO()}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </div>

          {/* Partner alias with picker */}
          <div>
            <label className="label" htmlFor="journal-alias">
              {t('journal.partnerAlias')}
            </label>

            {/* When linked to a partner: read-only alias + unlink option */}
            {formPartnerId ? (
              <div>
                <input
                  id="journal-alias"
                  type="text"
                  className="input w-full bg-stone-50 text-muted"
                  value={formAlias}
                  readOnly
                  tabIndex={-1}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted">
                    {t('journal.aliasManagedByPartner')}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={clearPartner}
                  >
                    <Unlink className="w-3 h-3" aria-hidden="true" />
                    {t('journal.unlinkFromPartner')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Recent partner chips */}
                {chipSuggestions.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-muted mb-1 block">
                      {t('journal.recentPartners')}
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                      {chipSuggestions.map((suggestion) => {
                        const isActive =
                          suggestion.type === 'alias' &&
                          formAlias.toLowerCase() === suggestion.alias.toLowerCase();

                        return (
                          <button
                            key={`${suggestion.type}-${suggestion.id ?? suggestion.alias}`}
                            type="button"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                              isActive
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                : 'bg-indigo-50 text-stone-700 border border-stone-200 hover:border-indigo-200 hover:bg-indigo-50/80'
                            }`}
                            onClick={() => selectPartner(suggestion)}
                          >
                            {suggestion.type === 'partner' && (
                              <Bookmark className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            )}
                            {suggestion.alias}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Alias input with autocomplete */}
                <div className="relative">
                  <input
                    ref={aliasInputRef}
                    id="journal-alias"
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={shouldShowDropdown}
                    aria-controls="alias-suggestions"
                    aria-activedescendant={
                      shouldShowDropdown && highlightedIndex >= 0
                        ? `suggestion-${highlightedIndex}`
                        : undefined
                    }
                    className="input w-full"
                    value={formAlias}
                    placeholder={t('journal.partnerAliasPlaceholder')}
                    maxLength={200}
                    onChange={(e) => {
                      setFormAlias(e.target.value);
                      setFormPartnerId(null);
                      setIsTyping(true);
                      setShowSuggestions(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                      if (formAlias.trim() && !formPartnerId) {
                        setShowSuggestions(true);
                        setIsTyping(true);
                        setHighlightedIndex(-1);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && shouldShowDropdown) {
                        e.preventDefault();
                        setHighlightedIndex((prev) =>
                          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                        );
                      } else if (e.key === 'ArrowUp' && shouldShowDropdown) {
                        e.preventDefault();
                        setHighlightedIndex((prev) =>
                          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
                        );
                      } else if (e.key === 'Enter' && shouldShowDropdown) {
                        e.preventDefault();
                        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
                          selectPartner(filteredSuggestions[highlightedIndex]);
                        } else {
                          setShowSuggestions(false);
                          setIsTyping(false);
                          setHighlightedIndex(-1);
                        }
                      }
                    }}
                    autoComplete="off"
                  />

                  {/* Autocomplete dropdown */}
                  {shouldShowDropdown && (
                    <ul
                      id="alias-suggestions"
                      role="listbox"
                      ref={suggestionsRef}
                      className="absolute z-10 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto list-none p-0 m-0"
                    >
                      {filteredSuggestions.map((suggestion, index) => (
                        <li
                          key={`${suggestion.type}-${suggestion.id ?? suggestion.alias}`}
                          id={`suggestion-${index}`}
                          role="option"
                          aria-selected={index === highlightedIndex}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2 transition-colors cursor-pointer ${index === highlightedIndex ? 'bg-indigo-50' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectPartner(suggestion);
                          }}
                        >
                          {suggestion.type === 'partner' && (
                            <Bookmark className="w-3 h-3 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                          )}
                          <span>{suggestion.alias}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Link to connection — hidden when a saved partner is selected */}
          {!formPartnerId && (
            <div>
              <label className="label" htmlFor="journal-connection">
                {t('journal.linkConnection')}
              </label>
              <select
                id="journal-connection"
                className="input"
                value={formConnectionId}
                onChange={(e) => setFormConnectionId(e.target.value)}
              >
                <option value="">{t('journal.noConnection')}</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.partnerDisplayName ?? conn.partnerUsername ?? conn.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phone number */}
          <div>
            <label className="label" htmlFor="journal-phone">
              {t('journal.phone')}
            </label>
            <div className="flex gap-2">
              <CountryCodePicker
                value={formCountryCode}
                onChange={setFormCountryCode}
              />
              <input
                id="journal-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input flex-1"
                value={formPhone}
                placeholder="5512345678"
                maxLength={15}
                onChange={handlePhoneChange}
                autoComplete="off"
              />
            </div>
            {phoneHint ? (
              <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
                {phoneHint}
              </p>
            ) : (
              <p className="text-xs text-muted mt-1">
                {t('journal.phoneHint')}
              </p>
            )}
          </div>

          {/* Encounter types */}
          <div>
            <label className="label">{t('journal.encounterType')}</label>
            <div className="flex flex-wrap gap-1.5">
              {['ORAL', 'ANAL', 'VAGINAL', 'MANUAL', 'OTHER'].map((type) => {
                const selected = formEncounterTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-indigo-200'
                    }`}
                    onClick={() =>
                      setFormEncounterTypes((prev) =>
                        selected ? prev.filter((et) => et !== type) : [...prev, type]
                      )
                    }
                  >
                    {t(`journal.encounterTypes.${type}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Protection methods */}
          <div>
            <label className="label">{t('journal.protectionMethods')}</label>
            <div className="flex flex-wrap gap-1.5">
              {['CONDOM', 'INTERNAL_CONDOM', 'PREP', 'PEP', 'DENTAL_DAM', 'NONE', 'OTHER'].map((method) => {
                const selected = formProtectionMethods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-indigo-200'
                    }`}
                    onClick={() =>
                      setFormProtectionMethods((prev) =>
                        selected ? prev.filter((pm) => pm !== method) : [...prev, method]
                      )
                    }
                  >
                    {t(`journal.protectionLabels.${method}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="journal-notes">
              {t('journal.notes')}
            </label>
            <textarea
              id="journal-notes"
              className="input"
              rows={3}
              value={formNotes}
              placeholder={t('journal.notesPlaceholder')}
              maxLength={5000}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          {/* Custom fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label mb-0">{t('journal.customFields')}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addCustomField}
                disabled={customFields.length >= MAX_CUSTOM_FIELDS}
                title={
                  customFields.length >= MAX_CUSTOM_FIELDS
                    ? t('journal.maxFields')
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="nav-icon" aria-hidden="true" />
                  {t('journal.addField')}
                </span>
              </button>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-3">
                {customFields.map((cf, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input"
                        placeholder={t('journal.fieldLabelPlaceholder')}
                        value={cf.label}
                        maxLength={100}
                        onChange={(e) =>
                          updateCustomField(index, { label: e.target.value })
                        }
                        aria-label={t('journal.fieldLabel')}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('journal.fieldValuePlaceholder')}
                        value={cf.value}
                        maxLength={500}
                        onChange={(e) =>
                          updateCustomField(index, { value: e.target.value })
                        }
                        aria-label={t('journal.fieldValue')}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm flex-shrink-0"
                        onClick={() => removeCustomField(index)}
                        aria-label={t('journal.removeField')}
                        title={t('journal.removeField')}
                      >
                        <X className="nav-icon" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Save for future checkbox — only if label non-empty and not already saved */}
                    {cf.label.trim() &&
                      !savedLabels.includes(cf.label.trim()) && (
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cf.saveForFuture}
                            onChange={(e) =>
                              updateCustomField(index, {
                                saveForFuture: e.target.checked,
                              })
                            }
                          />
                          {t('journal.saveForFuture', { label: cf.label.trim() })}
                        </label>
                      )}
                  </div>
                ))}
              </div>
            )}

            {customFields.length >= MAX_CUSTOM_FIELDS && (
              <p className="text-xs text-muted mt-1">{t('journal.maxFields')}</p>
            )}
          </div>

          {/* Error message */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPending}
            >
              {t('journal.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                t('journal.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
