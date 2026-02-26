# Week 2 Layer 0 Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich the STI guide and calculator pages from functional-but-plain to scannable and engaging — adding quick-fact chips, taglines, per-row progress bars, and full Week 3 guide content.

**Architecture:** Micro-renderer utility converts markdown-style strings to React elements (no external dep). `STIContent` gets two new fields: `tagline` and `facts`. A shared `FactChips` component renders type/curable/vaccine chips used in both the guide index cards and guide detail Quick Stats block. Progress bar added inline inside calculator result rows.

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library, TailwindCSS + custom CSS vars, Lucide icons, react-i18next

---

## Task 1: `renderMarkdown` utility + tests

**Files:**
- Create: `frontend/src/lib/renderMarkdown.tsx`
- Create: `frontend/src/lib/renderMarkdown.test.tsx`

**Step 1: Write failing tests**

Create `frontend/src/lib/renderMarkdown.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  it('renders plain text as a paragraph', () => {
    const { container } = render(<>{renderMarkdown('Hello world')}</>);
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p!.textContent).toBe('Hello world');
  });

  it('renders a single bullet list item', () => {
    const { container } = render(<>{renderMarkdown('- Item one')}</>);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('Item one');
  });

  it('renders multiple bullet list items in one ul', () => {
    const { container } = render(<>{renderMarkdown('- Item one\n- Item two\n- Item three')}</>);
    const lists = container.querySelectorAll('ul');
    expect(lists).toHaveLength(1);
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('renders bold text with **', () => {
    const { container } = render(<>{renderMarkdown('Take **daily** medication')}</>);
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe('daily');
  });

  it('renders mixed paragraph then list', () => {
    const text = 'Symptoms include:\n- Fever\n- Rash\n- Fatigue';
    const { container } = render(<>{renderMarkdown(text)}</>);
    expect(container.querySelector('p')!.textContent).toBe('Symptoms include:');
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('renders multiple paragraphs separated by blank lines', () => {
    const text = 'First paragraph.\n\nSecond paragraph.';
    const { container } = render(<>{renderMarkdown(text)}</>);
    const paras = container.querySelectorAll('p');
    expect(paras).toHaveLength(2);
    expect(paras[0].textContent).toBe('First paragraph.');
    expect(paras[1].textContent).toBe('Second paragraph.');
  });

  it('handles empty string without throwing', () => {
    expect(() => render(<>{renderMarkdown('')}</>)).not.toThrow();
  });

  it('list followed by a paragraph', () => {
    const text = '- Point one\n- Point two\n\nNote below.';
    const { container } = render(<>{renderMarkdown(text)}</>);
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('p')!.textContent).toBe('Note below.');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/lib/renderMarkdown.test.tsx 2>&1 | tail -20
```
Expected: FAIL — `Cannot find module './renderMarkdown'`

**Step 3: Implement `renderMarkdown`**

Create `frontend/src/lib/renderMarkdown.tsx`:

```tsx
import React from 'react';

/**
 * Converts a markdown-style string to React elements.
 * Supported:
 *   Lines starting with "- " → <ul><li> (consecutive lines grouped into one <ul>)
 *   **text** → <strong>
 *   Plain text lines → <p>
 *   Blank lines → flush pending list, act as paragraph separator
 */
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let keyIdx = 0;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={keyIdx++}>
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      flushList();
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      elements.push(<p key={keyIdx++}>{renderInline(trimmed)}</p>);
    }
  }
  flushList();

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/lib/renderMarkdown.test.tsx 2>&1 | tail -10
```
Expected: All 8 tests PASS

**Step 5: Commit**

```bash
cd frontend && git add src/lib/renderMarkdown.tsx src/lib/renderMarkdown.test.tsx
git commit -m "feat: add renderMarkdown micro-renderer utility"
```

---

## Task 2: Update `stiContent.ts` — add types + tagline/facts to all 10 entries

**Files:**
- Modify: `frontend/src/lib/stiContent.ts`

**Step 1: Update the TypeScript interfaces**

Replace the `STIContent` interface (currently lines 36–43) with:

```ts
export interface STIContent {
  slug: string;
  title: { en: string; es: string };
  /** One plain-language sentence for cards and detail hero */
  tagline: { en: string; es: string };
  /** Quick facts rendered as chips */
  facts: {
    type: 'bacterial' | 'viral' | 'parasitic';
    /** true = antibiotics/antivirals resolve infection; false = lifelong management */
    curable: boolean;
    /** widely recommended vaccine exists */
    vaccine: boolean;
  };
  windowPeriod: WindowPeriod;
  /** Full guide content. undefined = coming soon */
  guide?: GuideSection;
}
```

**Step 2: Add tagline + facts to all 10 entries**

Add these fields to each entry in `STI_DATA`. The `guide` objects stay unchanged for now — only add the two new top-level fields:

**chlamydia:**
```ts
tagline: {
  en: 'The most common bacterial STI — usually silent, always curable.',
  es: 'La ITS bacteriana más común — generalmente sin síntomas, siempre curable.',
},
facts: { type: 'bacterial', curable: true, vaccine: false },
```

**gonorrhea:**
```ts
tagline: {
  en: 'A bacterial STI with rising antibiotic resistance — short testing window.',
  es: 'Una ITS bacteriana con resistencia creciente a antibióticos — ventana de prueba corta.',
},
facts: { type: 'bacterial', curable: true, vaccine: false },
```

**syphilis:**
```ts
tagline: {
  en: 'A staged bacterial infection — fully curable if caught early.',
  es: 'Una infección bacteriana por etapas — completamente curable si se detecta a tiempo.',
},
facts: { type: 'bacterial', curable: true, vaccine: false },
```

**hiv:**
```ts
tagline: {
  en: 'A virus managed with daily treatment — undetectable means untransmittable.',
  es: 'Un virus controlado con tratamiento diario — indetectable significa intransmisible.',
},
facts: { type: 'viral', curable: false, vaccine: false },
```

**herpes:**
```ts
tagline: {
  en: 'A lifelong but manageable virus — most people have mild or no symptoms.',
  es: 'Un virus de por vida pero manejable — la mayoría tiene síntomas leves o ninguno.',
},
facts: { type: 'viral', curable: false, vaccine: false },
```

**hpv:**
```ts
tagline: {
  en: 'The most common STI — vaccine-preventable, most infections clear on their own.',
  es: 'La ITS más común — prevenible con vacuna, la mayoría de las infecciones desaparecen solas.',
},
facts: { type: 'viral', curable: false, vaccine: true },
```

**hepatitis_b:**
```ts
tagline: {
  en: 'A vaccine-preventable liver infection — manageable with antivirals if chronic.',
  es: 'Una infección hepática prevenible con vacuna — manejable con antivirales si es crónica.',
},
facts: { type: 'viral', curable: false, vaccine: true },
```

**hepatitis_c:**
```ts
tagline: {
  en: 'No vaccine exists — but now curable in over 95% of cases with modern treatment.',
  es: 'No existe vacuna — pero ahora curable en más del 95% de los casos con tratamiento moderno.',
},
facts: { type: 'viral', curable: true, vaccine: false },
```

**trichomoniasis:**
```ts
tagline: {
  en: 'The most common curable STI worldwide — treated with a single antibiotic dose.',
  es: 'La ITS curable más común del mundo — tratada con una sola dosis de antibiótico.',
},
facts: { type: 'parasitic', curable: true, vaccine: false },
```

**mycoplasma_genitalium:**
```ts
tagline: {
  en: 'An underdiagnosed bacterial STI — not in routine panels, ask for it specifically.',
  es: 'Una ITS bacteriana subdiagnosticada — no está en los paneles rutinarios, pídela específicamente.',
},
facts: { type: 'bacterial', curable: true, vaccine: false },
```

**Step 3: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```
Expected: No errors (new required fields will fail if any entry is missing tagline/facts)

**Step 4: Commit**

```bash
cd frontend && git add src/lib/stiContent.ts
git commit -m "feat: add tagline and facts fields to all 10 STI entries"
```

---

## Task 3: Update `stiContent.test.ts` to cover new fields

**Files:**
- Modify: `frontend/src/lib/stiContent.test.ts`

**Step 1: Add tests for tagline and facts fields**

Add a new `describe` block after the existing `"required fields"` block:

```ts
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
```

**Step 2: Run tests**

```bash
cd frontend && npx vitest run src/lib/stiContent.test.ts 2>&1 | tail -15
```
Expected: All tests PASS (new fields are in place from Task 2)

**Step 3: Commit**

```bash
cd frontend && git add src/lib/stiContent.test.ts
git commit -m "test: add coverage for STI tagline and facts fields"
```

---

## Task 4: Reformat existing 5 guide sections with markdown + add Week 3 guides

**Files:**
- Modify: `frontend/src/lib/stiContent.ts`

This is a large content task. Two things happen together:
1. Reformat the existing 5 guide text fields to use `- bullets` and `**bold**` for scannability
2. Add full guide objects for the 5 Week 3 conditions

**Step 1: Update existing 5 guide section text**

For each of the 5 existing guides, update the section text to use markdown formatting. Keep the same medical facts — only change formatting. Apply this pattern:
- The `symptoms` section almost always has a list — convert inline comma lists to `- ` bullets
- The `treatment` section often lists steps — convert to bullets
- The `prevention` section often lists actions — convert to bullets
- `what` and `transmission` are usually fine as paragraphs

Example diff for **chlamydia symptoms**:

Before:
```
'Most people with chlamydia have no symptoms. When symptoms do occur, they may include: unusual discharge from the penis or vagina, burning or pain when urinating, pain or swelling in the testicles, rectal pain or discharge, and pain during sex. Symptoms typically appear 7–21 days after exposure.'
```

After:
```
'Most people with chlamydia have no symptoms. When symptoms occur, they may include:\n- Unusual discharge from the penis or vagina\n- Burning or pain when urinating\n- Pain or swelling in the testicles\n- Rectal pain or discharge\n- Pain during sex\n\nSymptoms typically appear 7–21 days after exposure.'
```

Apply the same transformation to `symptoms`, `treatment`, and `prevention` sections for: chlamydia, gonorrhea, syphilis, hiv, herpes. Use judgment — only add bullets where there's a natural list. Don't force bullets on narrative paragraphs.

**Step 2: Add Week 3 guide objects**

Add `guide` objects to: `hpv`, `hepatitis_b`, `hepatitis_c`, `trichomoniasis`, `mycoplasma_genitalium`.

**HPV guide:**
```ts
guide: {
  what: {
    en: 'HPV (Human Papillomavirus) is the most common sexually transmitted infection. Most people with HPV never develop symptoms and clear the virus naturally within 1–2 years. However, some strains cause genital warts, while high-risk strains can cause cancers of the cervix, anus, throat, penis, vagina, and vulva.',
    es: 'El VPH (Virus del Papiloma Humano) es la infección de transmisión sexual más común. La mayoría de las personas con VPH nunca desarrollan síntomas y eliminan el virus naturalmente en 1 a 2 años. Sin embargo, algunas cepas causan verrugas genitales, mientras que las cepas de alto riesgo pueden causar cánceres de cuello uterino, ano, garganta, pene, vagina y vulva.',
  },
  transmission: {
    en: 'HPV spreads through vaginal, anal, and oral sex — and through skin-to-skin genital contact even without penetration. It is so common that nearly all sexually active people get it at some point. HPV can be transmitted even when no symptoms are visible. Condoms reduce but do not fully prevent transmission because the virus can be present on skin not covered by a condom.',
    es: 'El VPH se transmite a través del sexo vaginal, anal y oral, y mediante el contacto piel a piel genital incluso sin penetración. Es tan común que casi todas las personas sexualmente activas lo contraen en algún momento. El VPH puede transmitirse incluso cuando no hay síntomas visibles. Los condones reducen pero no previenen completamente la transmisión.',
  },
  symptoms: {
    en: 'Most HPV infections produce no symptoms and clear on their own. When symptoms do occur:\n- **Genital warts** — soft, flesh-colored bumps on or around the genitals, anus, or thighs (caused by low-risk strains)\n- **Cervical changes** — detected by Pap/HPV screening, not felt by the person\n- **Cancer** — high-risk strains may cause cancer years later with no early warning symptoms\n\nThat\'s why screening is essential even without symptoms.',
    es: 'La mayoría de las infecciones por VPH no producen síntomas y desaparecen solas. Cuando ocurren síntomas:\n- **Verrugas genitales** — protuberancias blandas del color de la piel en o alrededor de los genitales, el ano o los muslos (causadas por cepas de bajo riesgo)\n- **Cambios cervicales** — detectados por tamizaje Pap/VPH, no sentidos por la persona\n- **Cáncer** — las cepas de alto riesgo pueden causar cáncer años después sin síntomas de advertencia tempranos\n\nPor eso el tamizaje es esencial incluso sin síntomas.',
  },
  testing: {
    en: 'There is no approved HPV test for people without a cervix. Testing options for people with a cervix:\n- **Pap test (Pap smear)** — checks for abnormal cervical cells; recommended starting at age 21\n- **HPV test** — checks for high-risk HPV strains directly; recommended starting at age 25–30\n- **Co-test** — Pap + HPV together; most comprehensive\n\nThe CDC recommends cervical screening every 3–5 years depending on test type and age. There is no approved HPV blood test or home test.',
    es: 'No existe una prueba de VPH aprobada para personas sin cuello uterino. Opciones de prueba para personas con cuello uterino:\n- **Prueba de Papanicolaou** — detecta células cervicales anormales; recomendada a partir de los 21 años\n- **Prueba de VPH** — detecta cepas de VPH de alto riesgo directamente; recomendada a partir de los 25-30 años\n- **Co-prueba** — Pap + VPH juntos; la más completa\n\nNo existe prueba de sangre ni prueba casera aprobada para VPH.',
  },
  treatment: {
    en: 'There is no treatment for HPV itself — the immune system clears most infections. What can be treated:\n- **Genital warts** — topical creams (imiquimod, podophyllin), cryotherapy, or minor procedures\n- **Precancerous cervical changes** — procedures like LEEP or cryotherapy remove abnormal tissue before it becomes cancer\n- **HPV-related cancers** — treated with standard cancer treatments (surgery, radiation, chemotherapy)\n\nRegular screening is the key to catching problems early.',
    es: 'No existe tratamiento para el VPH en sí: el sistema inmune elimina la mayoría de las infecciones. Lo que se puede tratar:\n- **Verrugas genitales** — cremas tópicas (imiquimod, podofilina), crioterapia o procedimientos menores\n- **Cambios cervicales precancerosos** — procedimientos como LEEP o crioterapia eliminan el tejido anormal antes de que se convierta en cáncer\n- **Cánceres relacionados con el VPH** — tratados con tratamientos estándar contra el cáncer\n\nEl tamizaje regular es clave para detectar problemas a tiempo.',
  },
  prevention: {
    en: 'Prevention options:\n- **HPV vaccine (Gardasil 9)** — highly effective against the strains that cause most genital warts and HPV-related cancers; recommended for all people ages 9–26, and some adults up to 45\n- **Condoms** — reduce but don\'t fully prevent transmission\n- **Regular cervical screening** — catches precancerous changes early (for people with a cervix)\n\nGetting vaccinated before becoming sexually active provides the best protection.',
    es: 'Opciones de prevención:\n- **Vacuna contra el VPH (Gardasil 9)** — muy eficaz contra las cepas que causan la mayoría de las verrugas genitales y cánceres relacionados con el VPH; recomendada para todas las personas de 9 a 26 años, y algunos adultos hasta los 45\n- **Condones** — reducen pero no previenen completamente la transmisión\n- **Tamizaje cervical regular** — detecta cambios precancerosos a tiempo (para personas con cuello uterino)\n\nVacunarse antes de ser sexualmente activo brinda la mejor protección.',
  },
  sources: [
    { label: 'CDC — HPV', url: 'https://www.cdc.gov/hpv/' },
    { label: 'WHO — Human papillomavirus (HPV)', url: 'https://www.who.int/news-room/fact-sheets/detail/human-papilloma-virus-and-cancer' },
    { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
  ],
},
```

**Hepatitis B guide:**
```ts
guide: {
  what: {
    en: 'Hepatitis B is a liver infection caused by the hepatitis B virus (HBV). Most adults who are infected clear the virus within 6 months (acute infection). When the virus persists beyond 6 months, it becomes chronic hepatitis B — which can lead to cirrhosis, liver failure, and liver cancer over time. A safe, effective vaccine prevents hepatitis B.',
    es: 'La hepatitis B es una infección hepática causada por el virus de la hepatitis B (VHB). La mayoría de los adultos infectados eliminan el virus en 6 meses (infección aguda). Cuando el virus persiste más de 6 meses, se convierte en hepatitis B crónica, que puede provocar cirrosis, insuficiencia hepática y cáncer de hígado con el tiempo. Una vacuna segura y eficaz previene la hepatitis B.',
  },
  transmission: {
    en: 'Hepatitis B spreads through blood, semen, and other body fluids:\n- Sexual contact (vaginal, anal, oral sex)\n- Sharing needles, syringes, or drug equipment\n- Mother to baby during birth\n- Needlestick injuries or sharing personal items like razors or toothbrushes\n\nHBV is **much more infectious than HIV** — it can survive outside the body for up to 7 days. It is not spread through casual contact, hugging, kissing, coughing, or sharing food.',
    es: 'La hepatitis B se transmite a través de la sangre, el semen y otros fluidos corporales:\n- Contacto sexual (sexo vaginal, anal, oral)\n- Compartir agujas, jeringas o equipo para drogas\n- De madre a bebé durante el parto\n- Lesiones por pinchazo o compartir artículos personales como rastrillos o cepillos de dientes\n\nEl VHB es **mucho más infeccioso que el VIH**: puede sobrevivir fuera del cuerpo hasta 7 días. No se transmite por contacto casual, abrazos, besos, tos ni compartir alimentos.',
  },
  symptoms: {
    en: 'Many people with acute hepatitis B have no symptoms. When symptoms appear (1–4 months after exposure):\n- Fatigue and weakness\n- Nausea, vomiting, loss of appetite\n- Abdominal pain (upper right side)\n- Dark urine, pale stools\n- Joint pain\n- Jaundice (yellowing of skin and eyes)\n\nChronic hepatitis B usually causes no symptoms for years — until significant liver damage has occurred.',
    es: 'Muchas personas con hepatitis B aguda no tienen síntomas. Cuando los síntomas aparecen (1 a 4 meses después de la exposición):\n- Fatiga y debilidad\n- Náuseas, vómitos, pérdida de apetito\n- Dolor abdominal (lado superior derecho)\n- Orina oscura, heces pálidas\n- Dolor articular\n- Ictericia (amarillamiento de piel y ojos)\n\nLa hepatitis B crónica generalmente no causa síntomas durante años, hasta que ocurre un daño hepático significativo.',
  },
  testing: {
    en: 'A blood test checks for hepatitis B markers:\n- **HBsAg** (surface antigen) — confirms active infection (window: 1–9 weeks)\n- **HBsAb** (surface antibody) — indicates immunity from vaccine or past infection\n- **HBcAb** (core antibody) — indicates past or current infection\n\nThe CDC recommends testing for all adults at least once, all pregnant people, and regular testing for people at higher risk. If positive, additional tests assess liver health and viral load.',
    es: 'Un análisis de sangre detecta los marcadores de hepatitis B:\n- **HBsAg** (antígeno de superficie) — confirma infección activa (ventana: 1-9 semanas)\n- **HBsAb** (anticuerpo de superficie) — indica inmunidad por vacuna o infección pasada\n- **HBcAb** (anticuerpo central) — indica infección pasada o presente\n\nLos CDC recomiendan realizarse la prueba al menos una vez para todos los adultos, todas las personas embarazadas, y pruebas regulares para personas de mayor riesgo.',
  },
  treatment: {
    en: 'Acute hepatitis B: supportive care (rest, fluids, avoid alcohol and liver-stressing medications). Most adults recover fully without specific antiviral treatment.\n\nChronic hepatitis B: antiviral medications (tenofovir, entecavir) suppress the virus and reduce risk of liver damage — but do not cure it. Regular monitoring of liver function is essential. Some people with chronic hepatitis B are eligible for interferon therapy. **There is no cure**, but treatment prevents progression to cirrhosis and liver cancer in most people.',
    es: 'Hepatitis B aguda: cuidados de apoyo (reposo, líquidos, evitar el alcohol y los medicamentos que estresan el hígado). La mayoría de los adultos se recuperan completamente sin tratamiento antiviral específico.\n\nHepatitis B crónica: los medicamentos antivirales (tenofovir, entecavir) suprimen el virus y reducen el riesgo de daño hepático, pero no lo curan. Es esencial el monitoreo regular de la función hepática. **No existe cura**, pero el tratamiento previene la progresión a cirrosis y cáncer de hígado en la mayoría de las personas.',
  },
  prevention: {
    en: 'Prevention options:\n- **Vaccine (3-dose series)** — highly effective, recommended for all infants, children, and unvaccinated adults\n- **Post-exposure**: hepatitis B immune globulin (HBIG) + vaccination within 24 hours of exposure\n- **Condoms** reduce sexual transmission risk\n- **Don\'t share needles**, syringes, razors, or toothbrushes\n- **Pregnant people** should be tested — newborns of HBsAg-positive mothers need HBIG + vaccine at birth',
    es: 'Opciones de prevención:\n- **Vacuna (3 dosis)** — muy eficaz, recomendada para todos los bebés, niños y adultos no vacunados\n- **Post-exposición**: inmunoglobulina contra la hepatitis B (IGHB) + vacunación dentro de las 24 horas de la exposición\n- **Condones** reducen el riesgo de transmisión sexual\n- **No compartir agujas**, jeringas, rastrillos ni cepillos de dientes\n- **Las personas embarazadas** deben hacerse la prueba — los recién nacidos de madres HBsAg positivas necesitan IGHB + vacuna al nacer',
  },
  sources: [
    { label: 'CDC — Hepatitis B', url: 'https://www.cdc.gov/hepatitis/hbv/' },
    { label: 'WHO — Hepatitis B', url: 'https://www.who.int/news-room/fact-sheets/detail/hepatitis-b' },
    { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
  ],
},
```

**Hepatitis C guide:**
```ts
guide: {
  what: {
    en: 'Hepatitis C is a liver infection caused by the hepatitis C virus (HCV). Unlike hepatitis B, there is no vaccine. However, hepatitis C is now **curable in more than 95% of cases** with 8–12 weeks of oral antiviral treatment (direct-acting antivirals / DAAs). Without treatment, chronic hepatitis C can lead to cirrhosis, liver failure, and liver cancer over decades.',
    es: 'La hepatitis C es una infección hepática causada por el virus de la hepatitis C (VHC). A diferencia de la hepatitis B, no existe vacuna. Sin embargo, la hepatitis C ahora es **curable en más del 95% de los casos** con 8 a 12 semanas de tratamiento antiviral oral (antivirales de acción directa / AAD). Sin tratamiento, la hepatitis C crónica puede provocar cirrosis, insuficiencia hepática y cáncer de hígado con el paso de los años.',
  },
  transmission: {
    en: 'Hepatitis C spreads primarily through blood-to-blood contact:\n- **Sharing needles, syringes, or drug equipment** (most common route)\n- Sexual transmission — less common, but possible during anal sex with bleeding, or when a partner has HIV\n- Sharing personal items like razors or toothbrushes (low risk)\n- From mother to baby during birth\n- Healthcare settings with poor infection control (less common in high-income countries)\n\nHCV is **not spread** through hugging, kissing, sharing food or water, or casual contact.',
    es: 'La hepatitis C se transmite principalmente a través del contacto sangre a sangre:\n- **Compartir agujas, jeringas o equipo para drogas** (vía más común)\n- Transmisión sexual — menos común, pero posible durante el sexo anal con sangrado, o cuando una pareja tiene VIH\n- Compartir artículos personales como rastrillos o cepillos de dientes (riesgo bajo)\n- De madre a bebé durante el parto\n- Entornos de salud con control deficiente de infecciones\n\nEl VHC **no se transmite** mediante abrazos, besos, compartir alimentos o agua, ni contacto casual.',
  },
  symptoms: {
    en: 'Most people with acute hepatitis C have no symptoms. When present:\n- Fatigue\n- Nausea or stomach pain\n- Dark urine, pale stools\n- Jaundice (yellowing of skin and eyes)\n- Fever\n\n75–85% of people develop chronic infection and may have no symptoms for decades while liver damage accumulates. This is why routine testing matters — most people discover HCV through a blood test, not symptoms.',
    es: 'La mayoría de las personas con hepatitis C aguda no tienen síntomas. Cuando están presentes:\n- Fatiga\n- Náuseas o dolor estomacal\n- Orina oscura, heces pálidas\n- Ictericia (amarillamiento de piel y ojos)\n- Fiebre\n\nEl 75-85% de las personas desarrollan infección crónica y pueden no tener síntomas durante décadas mientras se acumula el daño hepático. Por eso las pruebas rutinarias son importantes: la mayoría de las personas descubren el VHC a través de un análisis de sangre, no por síntomas.',
  },
  testing: {
    en: 'Testing involves two steps:\n1. **HCV antibody test** (screening) — detects antibodies, window period 8–11 weeks. A positive result means past or current infection.\n2. **HCV RNA test** (confirmatory) — detects active virus, confirms current infection\n\nThe CDC recommends hepatitis C testing:\n- At least once for all adults aged 18–79\n- During every pregnancy\n- Regularly for people who inject drugs or have other risk factors',
    es: 'Las pruebas implican dos pasos:\n1. **Prueba de anticuerpos VHC** (tamizaje) — detecta anticuerpos, período de ventana de 8 a 11 semanas. Un resultado positivo significa infección pasada o actual.\n2. **Prueba de ARN del VHC** (confirmatoria) — detecta el virus activo, confirma la infección actual\n\nLos CDC recomiendan la prueba de hepatitis C:\n- Al menos una vez para todos los adultos de 18 a 79 años\n- Durante cada embarazo\n- Regularmente para personas que se inyectan drogas u tienen otros factores de riesgo',
  },
  treatment: {
    en: '**Hepatitis C is curable.** Direct-acting antivirals (DAAs) achieve cure (SVR — sustained virologic response) in 95%+ of people:\n- Treatment duration: 8–12 weeks of daily oral pills\n- Minimal side effects compared to older interferon-based treatment\n- Works for all genotypes\n- Curing HCV does not provide immunity — re-infection is possible\n\nAfter cure, regular liver monitoring is still recommended for people with advanced fibrosis. Avoid alcohol during and after treatment.',
    es: '**La hepatitis C es curable.** Los antivirales de acción directa (AAD) logran la cura (RVS — respuesta virológica sostenida) en más del 95% de las personas:\n- Duración del tratamiento: 8 a 12 semanas de pastillas orales diarias\n- Efectos secundarios mínimos en comparación con el antiguo tratamiento basado en interferón\n- Funciona para todos los genotipos\n- La curación del VHC no proporciona inmunidad: la reinfección es posible\n\nDespués de la cura, se recomienda el monitoreo hepático regular para personas con fibrosis avanzada.',
  },
  prevention: {
    en: 'No vaccine exists for hepatitis C. Prevention:\n- **Don\'t share needles, syringes, or drug equipment** — this is the most important step\n- Use sterile equipment; harm reduction programs provide clean supplies\n- Use condoms to reduce sexual transmission risk\n- Don\'t share razors, toothbrushes, or nail clippers\n- Healthcare workers: follow standard precautions\n\nFor people who inject drugs, opioid treatment programs and syringe service programs significantly reduce HCV transmission.',
    es: 'No existe vacuna para la hepatitis C. Prevención:\n- **No compartir agujas, jeringas ni equipo para drogas** — este es el paso más importante\n- Usar equipo estéril; los programas de reducción de daños proporcionan suministros limpios\n- Usar condones para reducir el riesgo de transmisión sexual\n- No compartir rastrillos, cepillos de dientes ni cortaúñas\n- Trabajadores de salud: seguir las precauciones estándar\n\nPara personas que se inyectan drogas, los programas de tratamiento con opioides y los programas de jeringas reducen significativamente la transmisión del VHC.',
  },
  sources: [
    { label: 'CDC — Hepatitis C', url: 'https://www.cdc.gov/hepatitis/hcv/' },
    { label: 'WHO — Hepatitis C', url: 'https://www.who.int/news-room/fact-sheets/detail/hepatitis-c' },
    { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
  ],
},
```

**Trichomoniasis guide:**
```ts
guide: {
  what: {
    en: 'Trichomoniasis (or "trich") is caused by Trichomonas vaginalis, a tiny parasite. It is the **most common curable STI worldwide** — affecting an estimated 156 million people globally. Most people who have it show no symptoms, making it easy to spread unknowingly. It is highly treatable with a single dose of antibiotics.',
    es: 'La tricomoniasis (o "trico") es causada por Trichomonas vaginalis, un parásito diminuto. Es la **ITS curable más común en todo el mundo**, afectando a un estimado de 156 millones de personas. La mayoría de las personas que la tienen no muestran síntomas, lo que facilita su transmisión sin saberlo. Es muy tratable con una sola dosis de antibióticos.',
  },
  transmission: {
    en: 'Trichomoniasis spreads through vaginal sex and genital-to-genital contact. It infects the vagina, vulva, cervix, urethra, and sometimes the penis. It can also spread through shared sex toys.\n\nTrichomoniasis is **not spread** through anal or oral sex, toilet seats, hugging, kissing, or sharing food and drinks.',
    es: 'La tricomoniasis se transmite a través del sexo vaginal y el contacto genital a genital. Infecta la vagina, la vulva, el cuello uterino, la uretra y a veces el pene. También puede transmitirse a través de juguetes sexuales compartidos.\n\nLa tricomoniasis **no se transmite** a través del sexo anal u oral, asientos de inodoro, abrazos, besos ni compartir alimentos o bebidas.',
  },
  symptoms: {
    en: 'About **70% of people have no symptoms**. When symptoms occur (typically 5–28 days after exposure):\n- Itching, burning, redness, or soreness in the genital area\n- Discomfort or pain during urination or sex\n- Vaginal discharge that is clear, white, yellow, or greenish — often with an unusual or fishy odor\n- In people with penises: irritation or discharge from the urethra\n\nSymptoms can come and go. Having no symptoms doesn\'t mean you can\'t pass it to partners.',
    es: 'Aproximadamente el **70% de las personas no tiene síntomas**. Cuando los síntomas ocurren (típicamente de 5 a 28 días después de la exposición):\n- Picazón, ardor, enrojecimiento o dolor en el área genital\n- Incomodidad o dolor al orinar o durante el sexo\n- Flujo vaginal que es transparente, blanco, amarillo o verdoso, a menudo con un olor inusual o a pescado\n- En personas con pene: irritación o secreción de la uretra\n\nLos síntomas pueden aparecer y desaparecer. No tener síntomas no significa que no puedas transmitirlo a tus parejas.',
  },
  testing: {
    en: 'Trichomoniasis requires a specific test — it is often **not included in standard STI panels**. Ask your provider specifically if you think you may have been exposed. Test options:\n- **NAAT** (most sensitive) — urine sample or genital swab\n- **Wet prep microscopy** — swab examined under microscope; less sensitive\n- **Rapid antigen test** — available at some clinics\n\nThe CDC recommends annual testing for all sexually active people with a vagina.',
    es: 'La tricomoniasis requiere una prueba específica: a menudo **no está incluida en los paneles estándar de ITS**. Pregunta específicamente a tu proveedor si crees que pudiste haber estado expuesto/a. Opciones de prueba:\n- **NAAT** (más sensible) — muestra de orina o hisopo genital\n- **Microscopía en fresco** — hisopo examinado bajo el microscopio; menos sensible\n- **Prueba de antígeno rápido** — disponible en algunas clínicas\n\nLos CDC recomiendan pruebas anuales para todas las personas sexualmente activas con vagina.',
  },
  treatment: {
    en: 'Trichomoniasis is cured with antibiotics:\n- **Metronidazole** — single 2g dose (most common) or 7-day course; avoid alcohol for 24 hours after\n- **Tinidazole** — single 2g dose; avoid alcohol for 72 hours after\n\n**Both partners must be treated at the same time** to prevent re-infection — even if one has no symptoms. Avoid sex until all partners have completed treatment and symptoms resolve. Re-infection is common: get retested 3 months after treatment if sexually active.',
    es: 'La tricomoniasis se cura con antibióticos:\n- **Metronidazol** — dosis única de 2g (más común) o curso de 7 días; evitar el alcohol durante 24 horas después\n- **Tinidazol** — dosis única de 2g; evitar el alcohol durante 72 horas después\n\n**Ambas parejas deben tratarse al mismo tiempo** para evitar la reinfección, incluso si una no tiene síntomas. Evitar el sexo hasta que todas las parejas completen el tratamiento y los síntomas desaparezcan. La reinfección es común: hacerse la prueba 3 meses después del tratamiento si se es sexualmente activo/a.',
  },
  prevention: {
    en: 'Prevention steps:\n- **Condoms** reduce transmission risk — but trich can also spread in areas not covered by a condom\n- **Regular testing** if you have multiple partners\n- **Mutual monogamy** with a tested, uninfected partner eliminates risk\n- **Treat both partners** to avoid the ping-pong re-infection cycle\n\nHaving trichomoniasis increases susceptibility to other STIs including HIV, so prompt treatment is important.',
    es: 'Medidas de prevención:\n- **Condones** reducen el riesgo de transmisión, pero la trico también puede transmitirse en áreas no cubiertas por un condón\n- **Pruebas regulares** si tienes múltiples parejas\n- **Monogamia mutua** con una pareja analizada y no infectada elimina el riesgo\n- **Tratar a ambas parejas** para evitar el ciclo de reinfección de ida y vuelta\n\nTener tricomoniasis aumenta la susceptibilidad a otras ITS, incluido el VIH, por lo que el tratamiento oportuno es importante.',
  },
  sources: [
    { label: 'CDC — Trichomoniasis', url: 'https://www.cdc.gov/trichomoniasis/' },
    { label: 'WHO — Trichomoniasis', url: 'https://www.who.int/news-room/fact-sheets/detail/sexually-transmitted-infections-(stis)' },
    { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
  ],
},
```

**Mycoplasma genitalium guide:**
```ts
guide: {
  what: {
    en: 'Mycoplasma genitalium (MG) is a bacterium that causes urogenital infections. It is increasingly recognized as a significant STI but is often missed because it is **not included in standard STI panels** at many clinics. MG is associated with urethritis in people with penises, and cervicitis and pelvic inflammatory disease in people with vaginas. Antibiotic resistance is a major and growing concern.',
    es: 'Mycoplasma genitalium (MG) es una bacteria que causa infecciones urogenitales. Es cada vez más reconocida como una ITS significativa, pero a menudo se pasa por alto porque **no está incluida en los paneles estándar de ITS** de muchas clínicas. El MG se asocia con uretritis en personas con pene y con cervicitis y enfermedad inflamatoria pélvica en personas con vagina. La resistencia a los antibióticos es una preocupación importante y creciente.',
  },
  transmission: {
    en: 'Mycoplasma genitalium spreads through vaginal and anal sex. Whether it spreads through oral sex is uncertain. Like many STIs, it can be transmitted even when no symptoms are present. MG infection may increase susceptibility to HIV and other STIs.',
    es: 'Mycoplasma genitalium se transmite a través del sexo vaginal y anal. Si se transmite a través del sexo oral es incierto. Como muchas ITS, puede transmitirse incluso cuando no hay síntomas presentes. La infección por MG puede aumentar la susceptibilidad al VIH y otras ITS.',
  },
  symptoms: {
    en: 'Most people with MG have **no symptoms**. When present:\n- **In people with penises**: burning or pain when urinating, discharge from the urethra\n- **In people with vaginas**: unusual vaginal discharge, pain during sex, pelvic pain\n- Both: rectal discharge or discomfort (if anal sex)\n\nUntreated MG can cause serious complications:\n- Pelvic inflammatory disease (PID)\n- Increased risk of ectopic pregnancy\n- Potentially affects fertility\n- Reactive arthritis (rare)',
    es: 'La mayoría de las personas con MG **no tienen síntomas**. Cuando están presentes:\n- **En personas con pene**: ardor o dolor al orinar, secreción uretral\n- **En personas con vagina**: secreción vaginal inusual, dolor durante el sexo, dolor pélvico\n- Ambos: secreción rectal o malestar (si hay sexo anal)\n\nEl MG no tratado puede causar complicaciones graves:\n- Enfermedad inflamatoria pélvica (EIP)\n- Mayor riesgo de embarazo ectópico\n- Potencialmente afecta la fertilidad\n- Artritis reactiva (rara)',
  },
  testing: {
    en: 'MG is diagnosed with a **NAAT test** (urine sample or genital/rectal swab). Key points:\n- **Not in routine panels** at many clinics — ask specifically for MG testing\n- **Resistance testing** is recommended before prescribing antibiotics (to determine which antibiotic will actually work)\n- Some areas have point-of-care resistance tests; others require sending samples to a lab\n\nIf you have symptoms of urethritis or cervicitis and standard STI tests are negative, ask about MG.',
    es: 'El MG se diagnostica con una **prueba NAAT** (muestra de orina o hisopo genital/rectal). Puntos clave:\n- **No está en los paneles rutinarios** de muchas clínicas — pide específicamente la prueba de MG\n- Se recomienda **prueba de resistencia** antes de recetar antibióticos (para determinar qué antibiótico funcionará realmente)\n- Algunas áreas tienen pruebas de resistencia en el punto de atención; otras requieren enviar muestras a un laboratorio\n\nSi tienes síntomas de uretritis o cervicitis y las pruebas estándar de ITS son negativas, pregunta por el MG.',
  },
  treatment: {
    en: 'MG is treated with antibiotics, but **antibiotic resistance is a serious problem**:\n- **Standard approach**: azithromycin (first-line) followed by moxifloxacin if resistance is detected or azithromycin fails\n- **Resistance-guided therapy** is preferred: test for macrolide resistance first, then choose the appropriate antibiotic\n- Treatment failure is increasingly common — follow-up testing to confirm cure is essential\n\nAvoid sex until treatment is confirmed complete. Sexual partners should also be tested and treated.',
    es: 'El MG se trata con antibióticos, pero la **resistencia a los antibióticos es un problema grave**:\n- **Enfoque estándar**: azitromicina (primera línea) seguida de moxifloxacino si se detecta resistencia o la azitromicina falla\n- Se prefiere la **terapia guiada por resistencia**: primero analizar la resistencia a los macrólidos, luego elegir el antibiótico apropiado\n- El fracaso del tratamiento es cada vez más común: las pruebas de seguimiento para confirmar la cura son esenciales\n\nEvitar el sexo hasta que se confirme que el tratamiento está completo. Las parejas sexuales también deben hacerse la prueba y recibir tratamiento.',
  },
  prevention: {
    en: 'Prevention steps:\n- **Condoms** reduce transmission risk\n- **Get tested** if you have symptoms of urethritis or cervicitis — ask specifically for MG if standard tests are negative\n- **Treat partners** to prevent re-infection\n- **Avoid unnecessary antibiotic use** — antibiotic overuse drives resistance\n\nAwareness is key: MG is underdiagnosed because many people and providers don\'t know to test for it. If you have persistent genital symptoms with negative standard STI results, MG may be the cause.',
    es: 'Medidas de prevención:\n- **Condones** reducen el riesgo de transmisión\n- **Hacerse la prueba** si tienes síntomas de uretritis o cervicitis — pide específicamente la prueba de MG si los análisis estándar son negativos\n- **Tratar a las parejas** para evitar la reinfección\n- **Evitar el uso innecesario de antibióticos** — el uso excesivo de antibióticos impulsa la resistencia\n\nLa conciencia es clave: el MG está subdiagnosticado porque muchas personas y proveedores no saben que deben analizarlo.',
  },
  sources: [
    { label: 'CDC — Mycoplasma genitalium', url: 'https://www.cdc.gov/std/treatment-guidelines/mycoplasmagenitalium.htm' },
    { label: 'WHO — STIs', url: 'https://www.who.int/news-room/fact-sheets/detail/sexually-transmitted-infections-(stis)' },
    { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
  ],
},
```

**Step 3: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```
Expected: No errors

**Step 4: Commit**

```bash
cd frontend && git add src/lib/stiContent.ts
git commit -m "feat: add Week 3 guide content + reformat existing guide sections with markdown"
```

---

## Task 5: Update tests for Week 3 guide content

**Files:**
- Modify: `frontend/src/lib/stiContent.test.ts`
- Modify: `frontend/src/pages/GuideDetailPage.test.tsx`

**Step 1: Update `stiContent.test.ts`**

The `WEEK3_PENDING` array and its `"Week 3 conditions have no guide yet"` describe block must change. Now all 10 conditions have guides.

1. Remove the `WEEK3_PENDING` constant (it's no longer needed as a separate set)
2. Change `WEEK2_GUIDES` to cover all 10 conditions — rename it `ALL_GUIDES` and set it to `[...STI_ORDER]`
3. Replace the `"Week 3 conditions have no guide yet"` describe block with `"Week 3 conditions now have complete guide content"`:

```ts
const ALL_GUIDES = [...STI_ORDER];

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
```

Also delete or rename the old `WEEK2_GUIDES` const and its describe block — replace it with the above `ALL_GUIDES` block.

**Step 2: Update `GuideDetailPage.test.tsx`**

The HPV "coming soon" tests must become "has guide content" tests. Replace the `"GuideDetailPage — coming soon (HPV)"` describe block entirely:

```ts
describe('GuideDetailPage — HPV (full guide)', () => {
  it('renders HPV guide title', () => {
    renderWithSlug('hpv');
    expect(screen.getByRole('heading', { name: 'HPV', level: 1 })).toBeInTheDocument();
  });

  it('renders all 6 guide sections for HPV', () => {
    renderWithSlug('hpv');
    expect(screen.getByText('What is it?')).toBeInTheDocument();
    expect(screen.getByText('Prevention')).toBeInTheDocument();
  });

  it('does not show coming soon state for HPV', () => {
    renderWithSlug('hpv');
    expect(screen.queryByTestId('guide-coming-soon')).not.toBeInTheDocument();
  });
});
```

**Step 3: Run all tests**

```bash
cd frontend && npx vitest run src/lib/stiContent.test.ts src/pages/GuideDetailPage.test.tsx 2>&1 | tail -20
```
Expected: All tests PASS

**Step 4: Commit**

```bash
cd frontend && git add src/lib/stiContent.test.ts src/pages/GuideDetailPage.test.tsx
git commit -m "test: update stiContent and GuideDetailPage tests for Week 3 guide content"
```

---

## Task 6: Locale keys for fact chips

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Add keys to `en_US.json`**

Add a `"guide"` section at the end of the JSON (before the final `}`):

```json
"guide": {
  "factBacterial": "Bacterial",
  "factViral": "Viral",
  "factParasitic": "Parasitic",
  "factCurable": "Curable",
  "factLifelong": "Lifelong",
  "factVaccine": "Vaccine available",
  "factWindowDays": "days",
  "quickStatsCta": "Calculate my dates"
}
```

**Step 2: Add keys to `es_MX.json`**

```json
"guide": {
  "factBacterial": "Bacteriana",
  "factViral": "Viral",
  "factParasitic": "Parasitaria",
  "factCurable": "Curable",
  "factLifelong": "De por vida",
  "factVaccine": "Vacuna disponible",
  "factWindowDays": "días",
  "quickStatsCta": "Calcular mis fechas"
}
```

**Step 3: Run lint**

```bash
cd frontend && npm run lint 2>&1 | tail -10
```
Expected: No errors

**Step 4: Commit**

```bash
cd frontend && git add src/locales/en_US.json src/locales/es_MX.json
git commit -m "feat: add guide fact chip locale keys"
```

---

## Task 7: `FactChips` shared component

**Files:**
- Create: `frontend/src/components/layer0/FactChips.tsx`

**Step 1: Create the component**

```tsx
import { useTranslation } from 'react-i18next';
import type { STIContent } from '../../lib/stiContent';

interface Props {
  facts: STIContent['facts'];
}

export function FactChips({ facts }: Props) {
  const { t } = useTranslation();

  const typeKey = {
    bacterial: 'guide.factBacterial',
    viral: 'guide.factViral',
    parasitic: 'guide.factParasitic',
  }[facts.type];

  return (
    <div className="fact-chips">
      <span className={`fact-chip fact-chip--${facts.type}`}>
        {t(typeKey, facts.type)}
      </span>
      <span className={`fact-chip ${facts.curable ? 'fact-chip--curable' : 'fact-chip--lifelong'}`}>
        {facts.curable
          ? t('guide.factCurable', 'Curable')
          : t('guide.factLifelong', 'Lifelong')}
      </span>
      {facts.vaccine && (
        <span className="fact-chip fact-chip--vaccine">
          {t('guide.factVaccine', 'Vaccine available')}
        </span>
      )}
    </div>
  );
}
```

**Step 2: TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors

**Step 3: Commit**

```bash
cd frontend && git add src/components/layer0/FactChips.tsx
git commit -m "feat: add shared FactChips component for guide cards and detail"
```

---

## Task 8: CSS — fact chips, Quick Stats block, progress bar

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Add CSS at end of the Layer 0 sections (after `.calculator-sources-list a:hover`)**

Append to `index.css` after the existing calculator/guide styles:

```css
/* ============================================================
   Layer 0 — Fact Chips
   ============================================================ */

.fact-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.fact-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.625rem;
  border-radius: 99px;
  white-space: nowrap;
}

/* Type chips */
.fact-chip--bacterial {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.fact-chip--viral {
  background: rgba(139, 92, 246, 0.1);
  color: #6d28d9;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.fact-chip--parasitic {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* Curable / Lifelong */
.fact-chip--curable {
  background: rgba(22, 163, 74, 0.1);
  color: #15803d;
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.fact-chip--lifelong {
  background: var(--color-background-secondary);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
}

/* Vaccine */
.fact-chip--vaccine {
  background: rgba(20, 184, 166, 0.1);
  color: #0f766e;
  border: 1px solid rgba(20, 184, 166, 0.2);
}

/* ============================================================
   Layer 0 — Guide Quick Stats Block (replaces WindowPeriodCallout)
   ============================================================ */

.guide-quick-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: var(--color-background);
  border: 1.5px solid var(--color-border-light);
  border-radius: 0.875rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.guide-quick-stats-left {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.guide-quick-stats-window {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-foreground-secondary);
}

.guide-quick-stats-window-value {
  font-weight: 700;
  color: var(--color-foreground);
}

.guide-quick-stats-no-test {
  font-size: 0.8125rem;
  color: var(--color-muted);
  font-style: italic;
}

/* ============================================================
   Layer 0 — Calculator Progress Bar
   ============================================================ */

.calculator-progress-wrap {
  margin-top: 0.375rem;
}

.calculator-progress-label {
  font-size: 0.7rem;
  color: var(--color-muted);
  margin-bottom: 0.25rem;
  display: block;
}

.calculator-progress-bar {
  height: 4px;
  background: var(--color-border-light);
  border-radius: 99px;
  overflow: hidden;
  width: 100%;
  max-width: 160px;
}

.calculator-progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
}

.calculator-progress-fill--wait {
  background: var(--color-primary);
  opacity: 0.6;
}

.calculator-progress-fill--testable {
  background: var(--color-success);
}

/* Guide card tagline */
.guide-card-tagline {
  font-size: 0.8125rem;
  color: var(--color-foreground-secondary);
  line-height: 1.45;
  margin: 0 0 0.625rem;
}

/* Guide section body — rendered markdown */
.guide-section-body ul {
  margin: 0.5rem 0 0.5rem 0;
  padding-left: 1.25rem;
}

.guide-section-body li {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--color-foreground-secondary);
  margin-bottom: 0.25rem;
}

.guide-section-body p {
  margin: 0 0 0.5rem;
}

.guide-section-body p:last-child {
  margin-bottom: 0;
}

.guide-section-body strong {
  color: var(--color-foreground);
  font-weight: 600;
}
```

**Step 2: Run lint**

```bash
cd frontend && npm run lint 2>&1 | tail -10
```
Expected: No errors

**Step 3: Commit**

```bash
cd frontend && git add src/index.css
git commit -m "feat: add CSS for fact chips, Quick Stats block, progress bar, and markdown body"
```

---

## Task 9: Update `GuidesIndexPage` — tagline + fact chips

**Files:**
- Modify: `frontend/src/pages/GuidesIndexPage.tsx`

**Step 1: Update imports**

Add `FactChips` import at the top:

```tsx
import { FactChips } from '../components/layer0/FactChips';
```

**Step 2: Update `GuideCardContent` component**

Replace the entire `GuideCardContent` function with:

```tsx
function GuideCardContent({ sti, lang, hasGuide, isNoTest }: GuideCardContentProps) {
  return (
    <>
      <h2 className="guide-card-title">{sti.title[lang]}</h2>
      <p className="guide-card-tagline">{sti.tagline[lang]}</p>
      <FactChips facts={sti.facts} />
      <div className="guide-card-footer">
        {!isNoTest && (
          <p className="guide-card-window">
            {lang === 'es' ? 'Ventana: ' : 'Window: '}
            {sti.windowPeriod.minDays}–{sti.windowPeriod.maxDays}{' '}
            {lang === 'es' ? 'días' : 'days'}
          </p>
        )}
        <div className="guide-card-tags">
          {!hasGuide && (
            <span className="guide-tag guide-tag--coming-soon">
              {lang === 'es' ? 'Próximamente' : 'Coming soon'}
            </span>
          )}
          {isNoTest && (
            <span className="guide-tag guide-tag--no-test">
              {lang === 'es' ? 'Sin prueba rutinaria' : 'No routine test'}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
```

Note: The "Available" tag is removed — it's obvious when a card is clickable. Only "Coming soon" and "No routine test" tags are shown.

Also add `.guide-card-footer` CSS to `index.css` (append to guide card section):

```css
.guide-card-footer {
  margin-top: auto;
  padding-top: 0.5rem;
}
```

**Step 3: Update `GuideCardContentProps` interface**

The `isNoTest` type can stay, but verify the interface still matches (no changes needed beyond the component body).

**Step 4: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors

**Step 5: Run existing tests**

```bash
cd frontend && npx vitest run 2>&1 | tail -20
```
Expected: All passing

**Step 6: Commit**

```bash
cd frontend && git add src/pages/GuidesIndexPage.tsx src/index.css
git commit -m "feat: add tagline and fact chips to guide index cards"
```

---

## Task 10: Update `GuideDetailPage` — Quick Stats, unique icons, renderMarkdown

**Files:**
- Modify: `frontend/src/pages/GuideDetailPage.tsx`

**Step 1: Update imports**

Replace the current import block at the top with:

```tsx
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Clock,
  ChevronRight,
  ArrowRight,
  ArrowUpDown,
  Thermometer,
  FlaskConical,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import { STI_DATA, type Lang } from '../lib/stiContent';
import { useAuthOptional } from '../contexts/AuthContext';
import { FactChips } from '../components/layer0/FactChips';
import { renderMarkdown } from '../lib/renderMarkdown';
```

**Step 2: Update `GUIDE_SECTIONS` with unique icons**

Replace the `GUIDE_SECTIONS` constant:

```ts
const GUIDE_SECTIONS = [
  { key: 'what' as const,         labelEn: 'What is it?',    labelEs: '¿Qué es?',          icon: <BookOpen className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'transmission' as const, labelEn: 'How it spreads', labelEs: 'Cómo se transmite', icon: <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'symptoms' as const,     labelEn: 'Symptoms',       labelEs: 'Síntomas',          icon: <Thermometer className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'testing' as const,      labelEn: 'Testing',        labelEs: 'Pruebas',           icon: <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'treatment' as const,    labelEn: 'Treatment',      labelEs: 'Tratamiento',       icon: <Pill className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'prevention' as const,   labelEn: 'Prevention',     labelEs: 'Prevención',        icon: <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> },
] as const;
```

**Step 3: Update section grid to use renderMarkdown and inline icon**

Replace the `{GUIDE_SECTIONS.map(...)}` block inside the guide content section:

```tsx
{GUIDE_SECTIONS.map(({ key, labelEn, labelEs, icon }) => (
  <article key={key} className="guide-section" aria-labelledby={`section-${key}`}>
    <h2 id={`section-${key}`} className="guide-section-title">
      {icon}
      {lang === 'es' ? labelEs : labelEn}
    </h2>
    <div className="guide-section-body">
      {renderMarkdown(guide[key][lang])}
    </div>
  </article>
))}
```

Note: Change `<p className="guide-section-body">` to `<div className="guide-section-body">` since renderMarkdown returns block elements.

**Step 4: Replace `WindowPeriodCallout` with `QuickStatsBlock`**

Replace the call `<WindowPeriodCallout ... />` in the JSX (line ~110) with:

```tsx
<QuickStatsBlock slug={slug} windowPeriod={windowPeriod} facts={sti.facts} lang={lang} />
```

Then replace the entire `WindowPeriodCallout` function at the bottom of the file with:

```tsx
interface QuickStatsProps {
  slug: string;
  windowPeriod: import('../lib/stiContent').WindowPeriod;
  facts: import('../lib/stiContent').STIContent['facts'];
  lang: Lang;
}

function QuickStatsBlock({ slug, windowPeriod, facts, lang }: QuickStatsProps) {
  const { t } = useTranslation();
  return (
    <div className="guide-quick-stats">
      <div className="guide-quick-stats-left">
        <FactChips facts={facts} />
        <div className="guide-quick-stats-window">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {windowPeriod.noStandardTest ? (
            <span className="guide-quick-stats-no-test">{windowPeriod.note[lang]}</span>
          ) : (
            <>
              <span className="guide-window-callout-label">
                {lang === 'es' ? 'Período de ventana:' : 'Window period:'}
              </span>
              <span className="guide-quick-stats-window-value">
                {windowPeriod.minDays}–{windowPeriod.maxDays} {lang === 'es' ? 'días' : 'days'}
              </span>
            </>
          )}
        </div>
      </div>
      <Link
        to="/calculator"
        className="btn btn-secondary"
        aria-label={t('calculator.title', 'Window Period Calculator')}
        state={{ slug }}
      >
        <FlaskConical className="w-4 h-4 mr-1" aria-hidden="true" />
        {lang === 'es' ? 'Calcular mis fechas' : 'Calculate my dates'}
      </Link>
    </div>
  );
}
```

Also delete the now-unused `SectionIcon` function at the bottom of the file — icons are inlined in `GUIDE_SECTIONS`.

Also add the tagline to the hero subtitle. Find the `<p className="guide-subtitle">` tag and replace it:

```tsx
<p className="guide-subtitle">{sti.tagline[lang]}</p>
```

**Step 5: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors

**Step 6: Run all tests**

```bash
cd frontend && npx vitest run 2>&1 | tail -20
```
Expected: All passing (the GuideDetailPage tests check for sections by heading text — those still match)

Note: The test `"renders window period callout with correct range"` checks for `/5–14/` text. This text still appears inside QuickStatsBlock so it should still pass. Verify it does.

**Step 7: Commit**

```bash
cd frontend && git add src/pages/GuideDetailPage.tsx
git commit -m "feat: add Quick Stats block, unique section icons, and markdown rendering to guide detail"
```

---

## Task 11: Update `WindowPeriodCalculatorPage` — progress bar

**Files:**
- Modify: `frontend/src/pages/WindowPeriodCalculatorPage.tsx`

**Step 1: Update the results table rows to include a progress bar**

Inside the `{STI_ORDER.map((slug) => {` block, update the `calculator-cell-condition` cell:

Replace:
```tsx
<span role="cell" className="calculator-cell-condition">
  <Link to={`/guide/${slug}`} className="calculator-condition-link">
    {sti.title[lang]}
  </Link>
</span>
```

With:
```tsx
<span role="cell" className="calculator-cell-condition">
  <Link to={`/guide/${slug}`} className="calculator-condition-link">
    {sti.title[lang]}
  </Link>
  {result.status !== 'no-standard-test' && (
    <div className="calculator-progress-wrap">
      <span className="calculator-progress-label">
        {result.daysWaited} / {windowPeriod.minDays}{' '}
        {lang === 'es' ? 'días' : 'days'}
      </span>
      <div
        className="calculator-progress-bar"
        role="progressbar"
        aria-valuenow={result.daysWaited}
        aria-valuemin={0}
        aria-valuemax={windowPeriod.minDays}
        aria-label={`${sti.title[lang]} testing window progress`}
      >
        <div
          className={`calculator-progress-fill calculator-progress-fill--${result.status}`}
          style={{
            width: `${Math.min(100, (result.daysWaited / windowPeriod.minDays) * 100)}%`,
          }}
        />
      </div>
    </div>
  )}
</span>
```

**Step 2: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors

**Step 3: Run all tests**

```bash
cd frontend && npx vitest run 2>&1 | tail -20
```
Expected: All passing. The existing calculator tests check for condition names and status badges — the new progress wrap is additive and doesn't break those.

**Step 4: Commit**

```bash
cd frontend && git add src/pages/WindowPeriodCalculatorPage.tsx
git commit -m "feat: add per-row progress bar to calculator results"
```

---

## Task 12: Full test suite + lint verification

**Step 1: Run complete test suite**

```bash
cd frontend && npx vitest run 2>&1 | tail -30
```
Expected: All tests pass, 0 failures

**Step 2: Run TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1
```
Expected: No errors

**Step 3: Run lint**

```bash
cd frontend && npm run lint 2>&1
```
Expected: No warnings or errors

**Step 4: Final commit + push**

```bash
git add -A && git status
```
Verify only expected files are staged (no `.env`, no build artifacts).

```bash
git commit -m "feat: Week 2 Layer 0 polish — fact chips, taglines, progress bars, Week 3 guides"
git push
```

---

## Summary of commits

1. `feat: add renderMarkdown micro-renderer utility`
2. `feat: add tagline and facts fields to all 10 STI entries`
3. `test: add coverage for STI tagline and facts fields`
4. `feat: add Week 3 guide content + reformat existing guide sections with markdown`
5. `test: update stiContent and GuideDetailPage tests for Week 3 guide content`
6. `feat: add guide fact chip locale keys`
7. `feat: add shared FactChips component for guide cards and detail`
8. `feat: add CSS for fact chips, Quick Stats block, progress bar, and markdown body`
9. `feat: add tagline and fact chips to guide index cards`
10. `feat: add Quick Stats block, unique section icons, and markdown rendering to guide detail`
11. `feat: add per-row progress bar to calculator results`
12. `feat: Week 2 Layer 0 polish — fact chips, taglines, progress bars, Week 3 guides`
