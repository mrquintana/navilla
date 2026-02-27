import { describe, it, expect } from 'vitest';
import { STI_DATA, STI_ORDER, SYMPTOM_LABELS, PROVIDER_TIERS } from './stiContent';
import type { CostTier, ProviderKey } from './stiContent';

const ALL_GUIDES = [...STI_ORDER];

describe('STI_DATA', () => {
  it('contains all 10 conditions', () => {
    expect(Object.keys(STI_DATA)).toHaveLength(10);
  });

  it('STI_ORDER contains all 10 conditions', () => {
    expect(STI_ORDER).toHaveLength(10);
  });

  it('every condition is present in STI_ORDER', () => {
    const keys = Object.keys(STI_DATA);
    STI_ORDER.forEach((slug) => {
      expect(keys).toContain(slug);
    });
  });

  describe('required fields on every condition', () => {
    STI_ORDER.forEach((slug) => {
      it(`${slug} has slug, title.en, title.es, and windowPeriod`, () => {
        const sti = STI_DATA[slug];
        expect(sti).toBeDefined();
        expect(sti.slug).toBe(slug);
        expect(typeof sti.title.en).toBe('string');
        expect(sti.title.en.length).toBeGreaterThan(0);
        expect(typeof sti.title.es).toBe('string');
        expect(sti.title.es.length).toBeGreaterThan(0);
        expect(sti.windowPeriod).toBeDefined();
        expect(typeof sti.windowPeriod.note.en).toBe('string');
        expect(typeof sti.windowPeriod.note.es).toBe('string');
      });
    });
  });

  describe('tagline and facts on every condition', () => {
    STI_ORDER.forEach((slug) => {
      it(`${slug} has tagline.en, tagline.es, and valid facts`, () => {
        const sti = STI_DATA[slug];

        // tagline
        expect(typeof sti.tagline.en).toBe('string');
        expect(sti.tagline.en.length).toBeGreaterThan(10);
        expect(typeof sti.tagline.es).toBe('string');
        expect(sti.tagline.es.length).toBeGreaterThan(10);

        // facts.type
        expect(['bacterial', 'viral', 'parasitic']).toContain(sti.facts.type);

        // facts.curable and facts.vaccine are booleans
        expect(typeof sti.facts.curable).toBe('boolean');
        expect(typeof sti.facts.vaccine).toBe('boolean');
      });
    });

    it('conditions with a vaccine are HPV and Hepatitis B', () => {
      const withVaccine = STI_ORDER.filter((s) => STI_DATA[s].facts.vaccine);
      expect(withVaccine).toContain('hpv');
      expect(withVaccine).toContain('hepatitis_b');
      expect(withVaccine).toHaveLength(2);
    });

    it('trichomoniasis is the only parasitic condition', () => {
      const parasitic = STI_ORDER.filter((s) => STI_DATA[s].facts.type === 'parasitic');
      expect(parasitic).toEqual(['trichomoniasis']);
    });
  });

  describe('window period data validity', () => {
    const testable = STI_ORDER.filter((s) => !STI_DATA[s].windowPeriod.noStandardTest);

    testable.forEach((slug) => {
      it(`${slug} has minDays < maxDays`, () => {
        const { minDays, maxDays } = STI_DATA[slug].windowPeriod;
        expect(minDays).toBeGreaterThanOrEqual(0);
        expect(maxDays).toBeGreaterThan(minDays);
      });
    });

    it('HPV is flagged noStandardTest', () => {
      expect(STI_DATA.hpv.windowPeriod.noStandardTest).toBe(true);
    });
  });

  describe('symptom data integrity', () => {
    it('SYMPTOM_LABELS is defined and non-empty', () => {
      expect(Object.keys(SYMPTOM_LABELS).length).toBeGreaterThan(0);
    });

    it('every condition has a symptoms array', () => {
      STI_ORDER.forEach((slug) => {
        expect(Array.isArray(STI_DATA[slug].symptoms)).toBe(true);
      });
    });

    it('every symptom key used in STI_DATA exists in SYMPTOM_LABELS', () => {
      const validKeys = new Set(Object.keys(SYMPTOM_LABELS));
      STI_ORDER.forEach((slug) => {
        STI_DATA[slug].symptoms.forEach((key) => {
          expect(validKeys.has(key), `Unknown symptom key "${key}" on ${slug}`).toBe(true);
        });
      });
    });
  });

  describe('all 10 conditions have complete guide content', () => {
    ALL_GUIDES.forEach((slug) => {
      it(`${slug} has complete guide content`, () => {
        const { guide } = STI_DATA[slug];
        expect(guide).toBeDefined();
        if (!guide) return;

        const sections = ['what', 'transmission', 'symptoms', 'testing', 'treatment', 'prevention'] as const;
        sections.forEach((section) => {
          expect(typeof guide[section].en).toBe('string');
          expect(guide[section].en.length).toBeGreaterThan(20);
          expect(typeof guide[section].es).toBe('string');
          expect(guide[section].es.length).toBeGreaterThan(20);
        });

        expect(guide.sources.length).toBeGreaterThan(0);
        guide.sources.forEach((source) => {
          expect(typeof source.label).toBe('string');
          expect(source.url).toMatch(/^https?:\/\//);
        });
      });
    });
  });

  describe('cost tier data', () => {
    const VALID_COST_TIERS: CostTier[] = ['free', '$', '$$', '$$$', 'n/a'];
    const PROVIDER_KEYS: ProviderKey[] = ['capasits', 'imss', 'private_lab', 'private_clinic', 'specialist'];

    it('PROVIDER_TIERS has 5 entries with required fields', () => {
      expect(PROVIDER_TIERS).toHaveLength(5);
      for (const tier of PROVIDER_TIERS) {
        expect(tier.key).toBeDefined();
        expect(typeof tier.label.en).toBe('string');
        expect(typeof tier.label.es).toBe('string');
        expect(typeof tier.description.en).toBe('string');
        expect(typeof tier.description.es).toBe('string');
      }
    });

    it('PROVIDER_TIERS keys match ProviderKey union', () => {
      const keys = PROVIDER_TIERS.map((t) => t.key);
      expect(keys).toEqual(PROVIDER_KEYS);
    });

    it.each(STI_ORDER)('STI %s has costTiers with valid values', (slug) => {
      const sti = STI_DATA[slug];
      expect(sti.costTiers).toBeDefined();
      for (const [key, value] of Object.entries(sti.costTiers!)) {
        expect(PROVIDER_KEYS).toContain(key);
        expect(VALID_COST_TIERS).toContain(value);
      }
    });
  });
});
