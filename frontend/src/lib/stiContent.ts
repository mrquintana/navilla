/**
 * Layer 0 STI content — single source of truth for all public health content.
 *
 * Rules for this file (must be prerender-compatible):
 * - No React imports
 * - No i18n/useTranslation — components pick language via i18n.language
 * - Content sourced from CDC, WHO, and CENSIDA guidelines
 *
 * Week 2: chlamydia, gonorrhea, syphilis, hiv, herpes have full guide content.
 * Week 3: hpv, hepatitis_b, hepatitis_c, trichomoniasis, mycoplasma_genitalium.
 */

export type Lang = 'en' | 'es';

export interface WindowPeriod {
  /** Earliest days after exposure for a reliable test result */
  minDays: number;
  /** Days after exposure for a conclusive/definitive result */
  maxDays: number;
  /** Extra context note shown with the condition */
  note: { en: string; es: string };
  /** True for HPV — no routine screening test exists for most people */
  noStandardTest?: boolean;
}

export interface GuideSection {
  what: { en: string; es: string };
  transmission: { en: string; es: string };
  symptoms: { en: string; es: string };
  testing: { en: string; es: string };
  treatment: { en: string; es: string };
  prevention: { en: string; es: string };
  sources: Array<{ label: string; url: string }>;
}

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
  symptoms: string[];
  windowPeriod: WindowPeriod;
  /** Full guide content. undefined = coming soon */
  guide?: GuideSection;
}

// ---------------------------------------------------------------------------
// SYMPTOM LABELS — bilingual display text for each symptom key
//
// HOW TO MAINTAIN THIS:
//
//   Add a new symptom globally:
//     1. Add one entry to SYMPTOM_LABELS below (pick a snake_case key)
//     2. Add that key to the `symptoms` array of whichever STIs apply
//     3. Done — the filter picks it up automatically
//
//   Remove a symptom from one STI only:
//     1. Delete the key from that STI's `symptoms` array below
//     2. Nothing else to touch
//
//   Add a brand new STI:
//     1. Add an entry to STI_DATA with `symptoms: [...]` using existing keys
//        (if it needs a new symptom key, add that to SYMPTOM_LABELS first)
//     2. Add the slug to STI_ORDER
//
//   Rename a symptom key:
//     1. Update the key in SYMPTOM_LABELS
//     2. Find-replace that key string across all `symptoms` arrays in STI_DATA
//
// DATA SOURCE: Derived from CDC/WHO clinical guidelines.
// ⚠️  MUST be verified against authoritative sources before public launch.
//     See UPCOMING_FEATURES_AND_ROADMAP.md → "Authoritative STI Content Sources"
// ---------------------------------------------------------------------------
export const SYMPTOM_LABELS: Record<string, { en: string; es: string }> = {
  burning_urination:   { en: 'Burning when urinating',       es: 'Ardor al orinar' },
  unusual_discharge:   { en: 'Unusual discharge',             es: 'Secreción inusual' },
  sores_or_ulcers:     { en: 'Sores or ulcers',               es: 'Llagas o úlceras' },
  rash:                { en: 'Rash or skin changes',          es: 'Sarpullido o cambios en la piel' },
  itching:             { en: 'Itching or irritation',         es: 'Comezón o irritación' },
  swollen_lymph_nodes: { en: 'Swollen lymph nodes',           es: 'Ganglios inflamados' },
  pelvic_pain:         { en: 'Pelvic or abdominal pain',      es: 'Dolor pélvico o abdominal' },
  pain_during_sex:     { en: 'Pain during sex',               es: 'Dolor durante el sexo' },
  warts_or_bumps:      { en: 'Warts or bumps',                es: 'Verrugas o bultos' },
  flu_like_symptoms:   { en: 'Flu-like symptoms',             es: 'Síntomas gripales' },
};

export const STI_DATA: Record<string, STIContent> = {
  chlamydia: {
    slug: 'chlamydia',
    title: { en: 'Chlamydia', es: 'Clamidia' },
    tagline: {
      en: 'The most common bacterial STI — usually silent, always curable.',
      es: 'La ITS bacteriana más común — generalmente sin síntomas, siempre curable.',
    },
    facts: { type: 'bacterial', curable: true, vaccine: false },
    symptoms: ['burning_urination', 'unusual_discharge', 'pelvic_pain', 'pain_during_sex'],
    windowPeriod: {
      minDays: 5,
      maxDays: 14,
      note: {
        en: 'NAAT urine or swab test; most common bacterial STI',
        es: 'Prueba NAAT de orina o hisopo; ITS bacteriana más común',
      },
    },
    guide: {
      what: {
        en: 'Chlamydia is a common sexually transmitted infection caused by the bacterium Chlamydia trachomatis. It is one of the most frequently reported STIs worldwide, yet most people who have it experience no symptoms at all, making regular testing essential.',
        es: 'La clamidia es una infección de transmisión sexual común causada por la bacteria Chlamydia trachomatis. Es una de las ITS más reportadas en todo el mundo, pero la mayoría de las personas no presentan síntomas, lo que hace que las pruebas regulares sean esenciales.',
      },
      transmission: {
        en: 'Chlamydia spreads through vaginal, anal, and oral sex with an infected person. It can infect the penis, vagina, cervix, anus, urethra, and throat. It can also be passed from a pregnant person to their baby during childbirth. Condoms significantly reduce the risk of transmission.',
        es: 'La clamidia se transmite a través del sexo vaginal, anal y oral con una persona infectada. Puede infectar el pene, la vagina, el cuello uterino, el ano, la uretra y la garganta. También puede transmitirse de una persona embarazada a su bebé durante el parto. Los condones reducen significativamente el riesgo de transmisión.',
      },
      symptoms: {
        en: 'Most people with chlamydia have no symptoms. When symptoms occur, they may include:\n- Unusual discharge from the penis or vagina\n- Burning or pain when urinating\n- Pain or swelling in the testicles\n- Rectal pain or discharge\n- Pain during sex\n\nSymptoms typically appear 7–21 days after exposure.',
        es: 'La mayoría de las personas con clamidia no tienen síntomas. Cuando los síntomas ocurren, pueden incluir:\n- Secreción inusual del pene o la vagina\n- Ardor o dolor al orinar\n- Dolor o hinchazón en los testículos\n- Dolor rectal o secreción\n- Dolor durante el sexo\n\nLos síntomas generalmente aparecen de 7 a 21 días después de la exposición.',
      },
      testing: {
        en: 'Chlamydia is diagnosed with a NAAT (nucleic acid amplification test) — a urine test or a swab of the affected area (cervix, urethra, rectum, or throat). Testing is recommended annually for all sexually active people under 25, and for older people with new or multiple partners. Home test kits are available.',
        es: 'La clamidia se diagnostica con una prueba NAAT (amplificación de ácido nucleico): una prueba de orina o un hisopo del área afectada (cuello uterino, uretra, recto o garganta). Se recomienda hacerse la prueba anualmente para todas las personas sexualmente activas menores de 25 años, y para personas mayores con parejas nuevas o múltiples.',
      },
      treatment: {
        en: 'Chlamydia is curable with antibiotics:\n- Single dose of azithromycin, or\n- 7-day course of doxycycline\n\nBoth you and your recent sexual partners should be tested and treated. Avoid sex for 7 days after treatment (or until all partners are treated). Untreated chlamydia can cause serious health problems including pelvic inflammatory disease and infertility.',
        es: 'La clamidia es curable con antibióticos:\n- Dosis única de azitromicina, o\n- Tratamiento de 7 días con doxiciclina\n\nTanto usted como sus parejas sexuales recientes deben hacerse la prueba y recibir tratamiento. Evite el sexo durante 7 días después del tratamiento. La clamidia no tratada puede causar graves problemas de salud, incluida la enfermedad inflamatoria pélvica y la infertilidad.',
      },
      prevention: {
        en: 'Prevention steps:\n- Use condoms or dental dams every time you have sex\n- Get tested regularly, especially if you have new or multiple partners\n- Talk openly with partners about STI status and testing\n\nPrEP does not protect against chlamydia. Annual testing is the most effective prevention strategy alongside consistent condom use.',
        es: 'Medidas de prevención:\n- Use condones o barreras dentales cada vez que tenga relaciones sexuales\n- Hágase pruebas regularmente, especialmente si tiene parejas nuevas o múltiples\n- Hable abiertamente con sus parejas sobre el estado de ITS y las pruebas\n\nEl PrEP no protege contra la clamidia. Las pruebas anuales son la estrategia de prevención más efectiva junto con el uso consistente de condones.',
      },
      sources: [
        { label: 'CDC — Chlamydia', url: 'https://www.cdc.gov/chlamydia/' },
        { label: 'WHO — Chlamydia', url: 'https://www.who.int/news-room/fact-sheets/detail/chlamydia' },
        { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
      ],
    },
  },

  gonorrhea: {
    slug: 'gonorrhea',
    title: { en: 'Gonorrhea', es: 'Gonorrea' },
    tagline: {
      en: 'A bacterial STI with rising antibiotic resistance — short testing window.',
      es: 'Una ITS bacteriana con resistencia creciente a antibióticos — ventana de prueba corta.',
    },
    facts: { type: 'bacterial', curable: true, vaccine: false },
    symptoms: ['burning_urination', 'unusual_discharge', 'pelvic_pain', 'pain_during_sex'],
    windowPeriod: {
      minDays: 1,
      maxDays: 14,
      note: {
        en: 'NAAT urine or swab test; antibiotic resistance is a growing concern',
        es: 'Prueba NAAT de orina o hisopo; la resistencia a los antibióticos es una preocupación creciente',
      },
    },
    guide: {
      what: {
        en: 'Gonorrhea is a sexually transmitted infection caused by the bacterium Neisseria gonorrhoeae. It can infect the genitals, rectum, and throat. It is the second most commonly reported notifiable condition in the United States. Antibiotic-resistant strains are an increasing public health concern.',
        es: 'La gonorrea es una infección de transmisión sexual causada por la bacteria Neisseria gonorrhoeae. Puede infectar los genitales, el recto y la garganta. Es la segunda condición notificable más comúnmente reportada en los Estados Unidos. Las cepas resistentes a los antibióticos son una preocupación creciente de salud pública.',
      },
      transmission: {
        en: 'Gonorrhea spreads through vaginal, anal, and oral sex. It can infect the penis, vagina, cervix, anus, urethra, and throat. A pregnant person can pass it to their baby during delivery, potentially causing serious eye infection. Pre-ejaculatory fluid can also transmit the infection.',
        es: 'La gonorrea se transmite a través del sexo vaginal, anal y oral. Puede infectar el pene, la vagina, el cuello uterino, el ano, la uretra y la garganta. Una persona embarazada puede transmitírsela a su bebé durante el parto, lo que puede causar una infección ocular grave. El líquido pre-eyaculatorio también puede transmitir la infección.',
      },
      symptoms: {
        en: 'Many people with gonorrhea have no symptoms. When present, symptoms may include:\n- Burning when urinating\n- White, yellow, or green discharge from the penis or vagina\n- Painful or swollen testicles\n- Rectal pain or discharge\n\nThroat infections are usually asymptomatic. Symptoms appear 1–14 days after exposure.',
        es: 'Muchas personas con gonorrea no tienen síntomas. Cuando están presentes, los síntomas pueden incluir:\n- Ardor al orinar\n- Secreción blanca, amarilla o verde del pene o la vagina\n- Testículos dolorosos o inflamados\n- Dolor rectal o secreción\n\nLas infecciones de garganta suelen ser asintomáticas. Los síntomas aparecen de 1 a 14 días después de la exposición.',
      },
      testing: {
        en: 'Gonorrhea is diagnosed with a NAAT test — a urine sample or swab of the affected area. Because gonorrhea often occurs with chlamydia, testing for both at the same time is recommended. The CDC recommends annual testing for sexually active women under 25 and for all people at increased risk.',
        es: 'La gonorrea se diagnostica con una prueba NAAT: una muestra de orina o hisopo del área afectada. Debido a que la gonorrea a menudo ocurre junto con la clamidia, se recomienda hacerse la prueba para ambas al mismo tiempo. Los CDC recomiendan pruebas anuales para mujeres sexualmente activas menores de 25 años y para todas las personas con mayor riesgo.',
      },
      treatment: {
        en: 'Gonorrhea is treated with a single injection of ceftriaxone. Due to increasing antibiotic resistance, follow-up testing 1–2 weeks after treatment is recommended to confirm cure. Avoid sex until treatment is complete and symptoms resolve. Sexual partners from the last 60 days should be tested and treated.',
        es: 'La gonorrea se trata con una sola inyección de ceftriaxona. Debido a la creciente resistencia a los antibióticos, se recomienda una prueba de seguimiento 1-2 semanas después del tratamiento para confirmar la curación. Evite el sexo hasta que el tratamiento esté completo y los síntomas desaparezcan. Las parejas sexuales de los últimos 60 días deben hacerse la prueba y recibir tratamiento.',
      },
      prevention: {
        en: 'Prevention steps:\n- Use condoms or dental dams consistently with every sexual encounter\n- Get tested regularly\n- Discuss STI testing with partners before sex\n\nGonorrhea can be re-acquired — a previous infection does not provide immunity. Reducing the number of sexual partners lowers risk.',
        es: 'Medidas de prevención:\n- Use condones o barreras dentales de forma consistente en cada encuentro sexual\n- Hágase pruebas regularmente\n- Hable con sus parejas sobre las pruebas de ITS antes de tener relaciones sexuales\n\nLa gonorrea puede readquirirse: una infección previa no proporciona inmunidad. Reducir el número de parejas sexuales disminuye el riesgo.',
      },
      sources: [
        { label: 'CDC — Gonorrhea', url: 'https://www.cdc.gov/gonorrhea/' },
        { label: 'WHO — Gonorrhea', url: 'https://www.who.int/news-room/fact-sheets/detail/gonorrhoea-(neisseria-gonorrhoeae-infection)' },
        { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
      ],
    },
  },

  syphilis: {
    slug: 'syphilis',
    title: { en: 'Syphilis', es: 'Sífilis' },
    tagline: {
      en: 'A staged bacterial infection — fully curable if caught early.',
      es: 'Una infección bacteriana por etapas — completamente curable si se detecta a tiempo.',
    },
    facts: { type: 'bacterial', curable: true, vaccine: false },
    symptoms: ['sores_or_ulcers', 'rash', 'swollen_lymph_nodes', 'flu_like_symptoms'],
    windowPeriod: {
      minDays: 21,
      maxDays: 90,
      note: {
        en: 'Blood test (RPR/VDRL); may take up to 3 months for antibodies to appear',
        es: 'Prueba de sangre (RPR/VDRL); puede tomar hasta 3 meses para que aparezcan anticuerpos',
      },
    },
    guide: {
      what: {
        en: 'Syphilis is a sexually transmitted infection caused by the bacterium Treponema pallidum. It progresses through distinct stages — primary, secondary, latent, and tertiary — each with different symptoms. Syphilis is curable with antibiotics if detected early, but untreated syphilis can cause serious long-term health problems.',
        es: 'La sífilis es una infección de transmisión sexual causada por la bacteria Treponema pallidum. Progresa a través de etapas distintas: primaria, secundaria, latente y terciaria, cada una con síntomas diferentes. La sífilis es curable con antibióticos si se detecta a tiempo, pero la sífilis no tratada puede causar graves problemas de salud a largo plazo.',
      },
      transmission: {
        en: 'Syphilis spreads through direct contact with a syphilitic sore (chancre). Sores can be on the penis, vagina, anus, rectum, lips, and mouth. Transmission occurs during vaginal, anal, or oral sex. It can also pass from a pregnant person to their baby (congenital syphilis). Syphilis cannot be spread through casual contact — toilet seats, doorknobs, or clothing.',
        es: 'La sífilis se transmite a través del contacto directo con una llaga sifilítica (chancro). Las llagas pueden estar en el pene, la vagina, el ano, el recto, los labios y la boca. La transmisión ocurre durante el sexo vaginal, anal u oral. También puede transmitirse de una persona embarazada a su bebé (sífilis congénita). La sífilis no se puede transmitir a través del contacto casual.',
      },
      symptoms: {
        en: 'Syphilis progresses in stages:\n- **Primary**: A single painless sore at the infection site, lasting 3–6 weeks\n- **Secondary** (3–6 weeks later): Skin rash often on palms and soles, flu-like symptoms, mucous membrane sores\n- **Latent**: No symptoms\n- **Tertiary** (years later, if untreated): Serious damage to the heart, brain, nerves, and other organs',
        es: 'La sífilis progresa en etapas:\n- **Primaria**: Una sola llaga indolora en el lugar de la infección, que dura de 3 a 6 semanas\n- **Secundaria** (3-6 semanas después): Sarpullido en la piel a menudo en las palmas y plantas, síntomas similares a la gripe, llagas en las membranas mucosas\n- **Latente**: Sin síntomas\n- **Terciaria** (años después, si no se trata): Daños graves al corazón, cerebro, nervios y otros órganos',
      },
      testing: {
        en: 'Syphilis is diagnosed with a blood test — either RPR (rapid plasma reagin) or VDRL (Venereal Disease Research Laboratory) as a screening test, confirmed by treponemal tests. Testing should be done 3 months after potential exposure for the most accurate results. The CDC recommends annual testing for people at higher risk.',
        es: 'La sífilis se diagnostica con una prueba de sangre: RPR (reagina plasmática rápida) o VDRL (Laboratorio de Investigación de Enfermedades Venéreas) como prueba de detección, confirmada por pruebas treponémicas. Las pruebas deben realizarse 3 meses después de la posible exposición para obtener los resultados más precisos.',
      },
      treatment: {
        en: 'Syphilis is curable with penicillin G, given by injection. The stage of infection determines the dose and duration. People who are allergic to penicillin may be treated with doxycycline or tetracycline. Treatment kills the bacteria but cannot undo damage already done by late-stage syphilis. Partners from the last 90 days (primary) or last year (secondary) should be tested.',
        es: 'La sífilis es curable con penicilina G, administrada por inyección. El estadio de la infección determina la dosis y la duración. Las personas alérgicas a la penicilina pueden ser tratadas con doxiciclina o tetraciclina. El tratamiento mata las bacterias, pero no puede deshacer el daño causado por la sífilis en etapa tardía.',
      },
      prevention: {
        en: 'Prevention steps:\n- Use condoms consistently during all sexual activity\n- Get tested regularly — especially if you have new or multiple partners\n- If pregnant, get tested for syphilis at the first prenatal visit\n\nDoxycycline post-exposure prophylaxis (doxy-PEP) is an emerging option for high-risk individuals — talk to a doctor.',
        es: 'Medidas de prevención:\n- Use condones de forma consistente durante toda la actividad sexual\n- Las pruebas regulares son esenciales para la detección temprana\n- Si está embarazada, hágase la prueba de sífilis en la primera visita prenatal\n\nLa profilaxis post-exposición con doxiciclina (doxy-PEP) es una opción emergente para personas de alto riesgo: hable con un médico.',
      },
      sources: [
        { label: 'CDC — Syphilis', url: 'https://www.cdc.gov/syphilis/' },
        { label: 'WHO — Syphilis', url: 'https://www.who.int/news-room/fact-sheets/detail/syphilis' },
        { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
      ],
    },
  },

  hiv: {
    slug: 'hiv',
    title: { en: 'HIV', es: 'VIH' },
    tagline: {
      en: 'A virus managed with daily treatment — undetectable means untransmittable.',
      es: 'Un virus controlado con tratamiento diario — indetectable significa intransmisible.',
    },
    facts: { type: 'viral', curable: false, vaccine: false },
    symptoms: ['flu_like_symptoms', 'rash', 'swollen_lymph_nodes'],
    windowPeriod: {
      minDays: 18,
      maxDays: 45,
      note: {
        en: '4th-gen Ag/Ab test (antigen/antibody); earlier than older antibody-only tests',
        es: 'Prueba de 4ª gen Ag/Ac (antígeno/anticuerpo); más temprana que las pruebas antiguas solo de anticuerpos',
      },
    },
    guide: {
      what: {
        en: 'HIV (Human Immunodeficiency Virus) attacks the body\'s immune system, specifically CD4 T cells. Without treatment, HIV can progress to AIDS (Acquired Immunodeficiency Syndrome). With modern antiretroviral therapy (ART), people with HIV can live long, healthy lives and cannot sexually transmit the virus when their viral load is undetectable (U=U).',
        es: 'El VIH (Virus de Inmunodeficiencia Humana) ataca el sistema inmunológico del cuerpo, específicamente las células T CD4. Sin tratamiento, el VIH puede progresar al SIDA (Síndrome de Inmunodeficiencia Adquirida). Con la terapia antirretroviral (TAR) moderna, las personas con VIH pueden vivir vidas largas y saludables y no pueden transmitir el virus sexualmente cuando su carga viral es indetectable (I=I).',
      },
      transmission: {
        en: 'HIV is transmitted through blood, semen (including pre-seminal fluid), rectal fluids, vaginal fluids, and breast milk. The main routes of sexual transmission are anal and vaginal sex. Receptive anal sex carries the highest per-act risk. HIV cannot be transmitted through saliva, tears, sweat, air, water, or casual contact.',
        es: 'El VIH se transmite a través de la sangre, el semen (incluido el líquido preseminal), los fluidos rectales, los fluidos vaginales y la leche materna. Las principales vías de transmisión sexual son el sexo anal y vaginal. El sexo anal receptivo conlleva el mayor riesgo por acto. El VIH no puede transmitirse a través de la saliva, lágrimas, sudor, aire, agua o contacto casual.',
      },
      symptoms: {
        en: 'HIV symptoms vary by stage:\n- **Acute HIV** (2–4 weeks after infection): Flu-like symptoms — fever, chills, rash, night sweats, muscle aches, sore throat, fatigue, swollen lymph nodes. These last 2–4 weeks then resolve.\n- **Chronic HIV**: No symptoms for years while the virus slowly damages the immune system\n- **AIDS**: Rapid weight loss, recurring fever, extreme fatigue, swollen lymph glands, chronic diarrhea, pneumonia',
        es: 'Los síntomas del VIH varían según la etapa:\n- **VIH agudo** (2-4 semanas después de la infección): Síntomas similares a la gripe — fiebre, escalofríos, sarpullido, sudores nocturnos, dolores musculares, dolor de garganta, fatiga, ganglios linfáticos inflamados. Duran 2-4 semanas y luego desaparecen.\n- **VIH crónico**: Sin síntomas durante años mientras el virus daña lentamente el sistema inmune\n- **SIDA**: Pérdida rápida de peso, fiebre recurrente, fatiga extrema, ganglios inflamados, diarrea crónica, neumonía',
      },
      testing: {
        en: 'Testing options include: 4th-generation Ag/Ab combo tests (detect both HIV antigen and antibody — window period 18–45 days), antibody-only tests (45–90 days), and RNA/NAT tests (10–33 days, mostly used in clinical settings). Home tests are available. The CDC recommends all adults get tested at least once, and people at higher risk get tested at least annually.',
        es: 'Las opciones de prueba incluyen: Pruebas combinadas Ag/Ac de 4ª generación (detectan tanto el antígeno como el anticuerpo del VIH, período de ventana de 18 a 45 días), pruebas solo de anticuerpos (45-90 días) y pruebas de ARN/NAT (10-33 días, usadas principalmente en entornos clínicos). Las pruebas en casa están disponibles.',
      },
      treatment: {
        en: 'HIV is managed (not cured) with antiretroviral therapy (ART) — a combination of HIV medicines taken daily. ART reduces viral load to undetectable levels, preserves immune function, and means you cannot sexually transmit HIV (Undetectable = Untransmittable, U=U). Starting treatment early is essential. PrEP (pre-exposure prophylaxis) prevents HIV in HIV-negative people.',
        es: 'El VIH se controla (no se cura) con la terapia antirretroviral (TAR): una combinación de medicamentos para el VIH que se toma diariamente. La TAR reduce la carga viral a niveles indetectables, preserva la función inmune y significa que no puede transmitir el VIH sexualmente (Indetectable = Intransmisible, I=I). La PrEP (profilaxis pre-exposición) previene el VIH en personas VIH-negativas.',
      },
      prevention: {
        en: 'Highly effective prevention options:\n- **PrEP** (daily pill or long-acting injection) — reduces HIV risk by up to 99%\n- **Condoms** — reduce risk by ~99% when used correctly\n- **U=U** (treatment as prevention) — undetectable viral load means zero sexual transmission risk\n- **PEP** (post-exposure prophylaxis) — can prevent HIV if started within 72 hours of exposure\n\nRegular testing enables early treatment and protects partners.',
        es: 'Opciones de prevención muy eficaces:\n- **PrEP** (pastilla diaria o inyección de acción prolongada) — reduce el riesgo de VIH hasta en un 99%\n- **Condones** — reducen el riesgo en ~99% cuando se usan correctamente\n- **I=I** (tratamiento como prevención) — carga viral indetectable significa cero riesgo de transmisión sexual\n- **PEP** (profilaxis post-exposición) — puede prevenir el VIH si se inicia dentro de las 72 horas posteriores a la exposición\n\nLas pruebas regulares permiten el tratamiento temprano y protegen a las parejas.',
      },
      sources: [
        { label: 'CDC — HIV', url: 'https://www.cdc.gov/hiv/' },
        { label: 'WHO — HIV/AIDS', url: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids' },
        { label: 'CENSIDA — VIH/SIDA', url: 'https://www.gob.mx/censida' },
      ],
    },
  },

  herpes: {
    slug: 'herpes',
    title: { en: 'Herpes (HSV)', es: 'Herpes (VHS)' },
    tagline: {
      en: 'A lifelong but manageable virus — most people have mild or no symptoms.',
      es: 'Un virus de por vida pero manejable — la mayoría tiene síntomas leves o ninguno.',
    },
    facts: { type: 'viral', curable: false, vaccine: false },
    symptoms: ['sores_or_ulcers', 'itching', 'pain_during_sex', 'flu_like_symptoms'],
    windowPeriod: {
      minDays: 12,
      maxDays: 84,
      note: {
        en: 'Blood test (IgG); best if you have symptoms — testing without symptoms has limitations',
        es: 'Prueba de sangre (IgG); mejor si tiene síntomas — las pruebas sin síntomas tienen limitaciones',
      },
    },
    guide: {
      what: {
        en: 'Herpes is caused by the herpes simplex virus, which has two types: HSV-1 (commonly causes oral herpes/cold sores) and HSV-2 (most commonly causes genital herpes). Both types can affect the mouth or genitals. Herpes is a lifelong condition with no cure, but antiviral medications can manage symptoms and reduce transmission risk.',
        es: 'El herpes es causado por el virus del herpes simple, que tiene dos tipos: VHS-1 (comúnmente causa herpes oral/fuegos) y VHS-2 (más comúnmente causa herpes genital). Ambos tipos pueden afectar la boca o los genitales. El herpes es una condición de por vida sin cura, pero los medicamentos antivirales pueden controlar los síntomas y reducir el riesgo de transmisión.',
      },
      transmission: {
        en: 'Herpes spreads through skin-to-skin contact — including kissing, oral sex, vaginal sex, and anal sex — with an infected person. It can spread even when no sores are visible (asymptomatic shedding). Condoms reduce but don\'t eliminate risk because the virus can be present in areas not covered by a condom. Sharing lip balm, utensils, or razors can spread oral herpes.',
        es: 'El herpes se transmite a través del contacto piel a piel, incluidos besos, sexo oral, sexo vaginal y sexo anal, con una persona infectada. Puede transmitirse incluso cuando no hay llagas visibles (diseminación asintomática). Los condones reducen pero no eliminan el riesgo porque el virus puede estar presente en áreas no cubiertas por un condón.',
      },
      symptoms: {
        en: 'Many people with herpes have no or very mild symptoms. When symptoms occur:\n- Painful blisters or sores on or around the genitals, buttocks, thighs, or mouth\n- Flu-like symptoms during the first outbreak (fever, swollen lymph nodes)\n\nRecurrences are typically milder and shorter. The first outbreak can occur 2–12 days after exposure.',
        es: 'Muchas personas con herpes no tienen síntomas o los tienen muy leves. Cuando los síntomas ocurren:\n- Ampollas o llagas dolorosas en o alrededor de los genitales, glúteos, muslos o boca\n- Síntomas similares a la gripe durante el primer brote (fiebre, ganglios linfáticos inflamados)\n\nLas recurrencias suelen ser más leves y más cortas. El primer brote puede ocurrir de 2 a 12 días después de la exposición.',
      },
      testing: {
        en: 'The most accurate testing is a swab of an active sore sent for culture or PCR. Blood tests (HSV IgG antibody tests) can detect herpes without symptoms but have limitations: they cannot tell where infection is located, HSV-1 vs HSV-2 distinction matters for context, and false positives occur. The CDC does not recommend routine blood testing for people without symptoms.',
        es: 'La prueba más precisa es un hisopo de una llaga activa enviado para cultivo o PCR. Las pruebas de sangre (pruebas de anticuerpos IgG del VHS) pueden detectar el herpes sin síntomas, pero tienen limitaciones: no pueden indicar dónde está la infección, la distinción VHS-1 vs VHS-2 importa para el contexto, y pueden ocurrir falsos positivos.',
      },
      treatment: {
        en: 'There is no cure for herpes. Antiviral medications (acyclovir, valacyclovir, famciclovir) can:\n- Shorten outbreaks\n- Reduce severity of symptoms\n- Reduce the frequency of recurrences\n\nDaily suppressive therapy (taking antivirals every day) reduces transmission risk by about 50% and is recommended for people with frequent outbreaks or who want to protect partners.',
        es: 'No existe cura para el herpes. Los medicamentos antivirales (aciclovir, valaciclovir, famciclovir) pueden:\n- Acortar los brotes\n- Reducir la gravedad de los síntomas\n- Reducir la frecuencia de las recurrencias\n\nLa terapia supresora diaria (tomar antivirales todos los días) reduce el riesgo de transmisión en aproximadamente un 50% y se recomienda para personas con brotes frecuentes o que quieren proteger a sus parejas.',
      },
      prevention: {
        en: 'Prevention steps:\n- Use condoms or dental dams during sexual activity\n- Avoid sex during outbreaks or when you feel one starting (prodrome symptoms)\n- Consider daily suppressive antiviral therapy to reduce transmission risk\n- Disclose herpes status to partners before sexual contact\n\nHaving herpes does not mean you can\'t have fulfilling relationships.',
        es: 'Medidas de prevención:\n- Use condones o barreras dentales durante la actividad sexual\n- Evite las relaciones sexuales durante los brotes o cuando sienta que uno está comenzando\n- Considere la terapia antiviral supresora diaria para reducir el riesgo de transmisión\n- Revele su estado de herpes a sus parejas antes del contacto sexual\n\nTener herpes no significa que no pueda tener relaciones satisfactorias.',
      },
      sources: [
        { label: 'CDC — Genital Herpes', url: 'https://www.cdc.gov/herpes/' },
        { label: 'WHO — Herpes simplex virus', url: 'https://www.who.int/news-room/fact-sheets/detail/herpes-simplex-virus' },
        { label: 'CENSIDA — ITS', url: 'https://www.gob.mx/censida' },
      ],
    },
  },

  hpv: {
    slug: 'hpv',
    title: { en: 'HPV', es: 'VPH' },
    tagline: {
      en: 'The most common STI — vaccine-preventable, most infections clear on their own.',
      es: 'La ITS más común — prevenible con vacuna, la mayoría de las infecciones desaparecen solas.',
    },
    facts: { type: 'viral', curable: false, vaccine: true },
    symptoms: ['warts_or_bumps'],
    windowPeriod: {
      minDays: 0,
      maxDays: 0,
      noStandardTest: true,
      note: {
        en: 'No routine test for most people; cervical screening (Pap/HPV test) available for people with a cervix',
        es: 'Sin prueba rutinaria para la mayoría; tamizaje cervical (Pap/VPH) disponible para personas con cuello uterino',
      },
    },
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
  },

  hepatitis_b: {
    slug: 'hepatitis_b',
    title: { en: 'Hepatitis B', es: 'Hepatitis B' },
    tagline: {
      en: 'A vaccine-preventable liver infection — manageable with antivirals if chronic.',
      es: 'Una infección hepática prevenible con vacuna — manejable con antivirales si es crónica.',
    },
    facts: { type: 'viral', curable: false, vaccine: true },
    symptoms: ['flu_like_symptoms'],
    windowPeriod: {
      minDays: 30,
      maxDays: 60,
      note: {
        en: 'Blood test for HBsAg (surface antigen); vaccine-preventable',
        es: 'Prueba de sangre para HBsAg (antígeno de superficie); prevenible con vacuna',
      },
    },
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
  },

  hepatitis_c: {
    slug: 'hepatitis_c',
    title: { en: 'Hepatitis C', es: 'Hepatitis C' },
    tagline: {
      en: 'No vaccine exists — but now curable in over 95% of cases with modern treatment.',
      es: 'No existe vacuna — pero ahora curable en más del 95% de los casos con tratamiento moderno.',
    },
    facts: { type: 'viral', curable: true, vaccine: false },
    symptoms: ['flu_like_symptoms'],
    windowPeriod: {
      minDays: 56,
      maxDays: 77,
      note: {
        en: 'Blood test (HCV antibody); window period is 8–11 weeks',
        es: 'Prueba de sangre (anticuerpo VHC); el período de ventana es de 8 a 11 semanas',
      },
    },
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
  },

  trichomoniasis: {
    slug: 'trichomoniasis',
    title: { en: 'Trichomoniasis', es: 'Tricomoniasis' },
    tagline: {
      en: 'The most common curable STI worldwide — treated with a single antibiotic dose.',
      es: 'La ITS curable más común del mundo — tratada con una sola dosis de antibiótico.',
    },
    facts: { type: 'parasitic', curable: true, vaccine: false },
    symptoms: ['burning_urination', 'unusual_discharge', 'itching', 'pain_during_sex'],
    windowPeriod: {
      minDays: 5,
      maxDays: 28,
      note: {
        en: 'NAAT or wet prep; most common curable STI',
        es: 'NAAT o preparación en fresco; ITS curable más común',
      },
    },
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
  },

  mycoplasma_genitalium: {
    slug: 'mycoplasma_genitalium',
    title: { en: 'Mycoplasma genitalium', es: 'Mycoplasma genitalium' },
    tagline: {
      en: 'An underdiagnosed bacterial STI — not in routine panels, ask for it specifically.',
      es: 'Una ITS bacteriana subdiagnosticada — no está en los paneles rutinarios, pídela específicamente.',
    },
    facts: { type: 'bacterial', curable: true, vaccine: false },
    symptoms: ['burning_urination', 'unusual_discharge', 'pelvic_pain', 'pain_during_sex'],
    windowPeriod: {
      minDays: 14,
      maxDays: 21,
      note: {
        en: 'NAAT test; not all clinics offer routine testing',
        es: 'Prueba NAAT; no todas las clínicas ofrecen pruebas rutinarias',
      },
    },
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
  },
};

/** Ordered list for consistent display */
export const STI_ORDER = [
  'chlamydia',
  'gonorrhea',
  'syphilis',
  'hiv',
  'herpes',
  'hpv',
  'hepatitis_b',
  'hepatitis_c',
  'trichomoniasis',
  'mycoplasma_genitalium',
] as const;

export type STISlug = typeof STI_ORDER[number];
