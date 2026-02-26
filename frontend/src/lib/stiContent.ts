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
  windowPeriod: WindowPeriod;
  /** Full guide content. undefined = coming in Week 3 */
  guide?: GuideSection;
}

export const STI_DATA: Record<string, STIContent> = {
  chlamydia: {
    slug: 'chlamydia',
    title: { en: 'Chlamydia', es: 'Clamidia' },
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
        en: 'Most people with chlamydia have no symptoms. When symptoms do occur, they may include: unusual discharge from the penis or vagina, burning or pain when urinating, pain or swelling in the testicles, rectal pain or discharge, and pain during sex. Symptoms typically appear 7–21 days after exposure.',
        es: 'La mayoría de las personas con clamidia no tienen síntomas. Cuando los síntomas ocurren, pueden incluir: secreción inusual del pene o la vagina, ardor o dolor al orinar, dolor o hinchazón en los testículos, dolor rectal o secreción, y dolor durante el sexo. Los síntomas generalmente aparecen de 7 a 21 días después de la exposición.',
      },
      testing: {
        en: 'Chlamydia is diagnosed with a NAAT (nucleic acid amplification test) — a urine test or a swab of the affected area (cervix, urethra, rectum, or throat). Testing is recommended annually for all sexually active people under 25, and for older people with new or multiple partners. Home test kits are available.',
        es: 'La clamidia se diagnostica con una prueba NAAT (amplificación de ácido nucleico): una prueba de orina o un hisopo del área afectada (cuello uterino, uretra, recto o garganta). Se recomienda hacerse la prueba anualmente para todas las personas sexualmente activas menores de 25 años, y para personas mayores con parejas nuevas o múltiples.',
      },
      treatment: {
        en: 'Chlamydia is curable with antibiotics, usually a single dose of azithromycin or a 7-day course of doxycycline. Both you and your recent sexual partners should be tested and treated. Avoid sex for 7 days after treatment (or until all partners are treated). Untreated chlamydia can cause serious health problems including pelvic inflammatory disease and infertility.',
        es: 'La clamidia es curable con antibióticos, generalmente una dosis única de azitromicina o un tratamiento de 7 días con doxiciclina. Tanto usted como sus parejas sexuales recientes deben hacerse la prueba y recibir tratamiento. Evite el sexo durante 7 días después del tratamiento. La clamidia no tratada puede causar graves problemas de salud, incluida la enfermedad inflamatoria pélvica y la infertilidad.',
      },
      prevention: {
        en: 'Use condoms or dental dams every time you have sex. Get tested regularly, especially if you have new or multiple partners. Talk openly with partners about STI status and testing. PrEP does not protect against chlamydia. Annual testing is the most effective prevention strategy alongside consistent condom use.',
        es: 'Use condones o barreras dentales cada vez que tenga relaciones sexuales. Hágase pruebas regularmente, especialmente si tiene parejas nuevas o múltiples. Hable abiertamente con sus parejas sobre el estado de ITS y las pruebas. El PrEP no protege contra la clamidia. Las pruebas anuales son la estrategia de prevención más efectiva junto con el uso consistente de condones.',
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
        en: 'Many people with gonorrhea have no symptoms. When present, symptoms may include: burning when urinating, white, yellow, or green discharge from the penis or vagina, painful or swollen testicles, and rectal pain or discharge. Throat infections are usually asymptomatic. Symptoms appear 1–14 days after exposure.',
        es: 'Muchas personas con gonorrea no tienen síntomas. Cuando están presentes, los síntomas pueden incluir: ardor al orinar, secreción blanca, amarilla o verde del pene o la vagina, testículos dolorosos o inflamados, y dolor rectal o secreción. Las infecciones de garganta suelen ser asintomáticas. Los síntomas aparecen de 1 a 14 días después de la exposición.',
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
        en: 'Use condoms or dental dams consistently with every sexual encounter. Get tested regularly. Discuss STI testing with partners before sex. Gonorrhea can be re-acquired — a previous infection does not provide immunity. Reducing the number of sexual partners lowers risk.',
        es: 'Use condones o barreras dentales de forma consistente en cada encuentro sexual. Hágase pruebas regularmente. Hable con sus parejas sobre las pruebas de ITS antes de tener relaciones sexuales. La gonorrea puede readquirirse: una infección previa no proporciona inmunidad. Reducir el número de parejas sexuales disminuye el riesgo.',
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
        en: 'Primary stage: A single painless sore at the infection site, lasting 3–6 weeks. Secondary stage (3–6 weeks later): Skin rash (often on palms and soles), flu-like symptoms, mucous membrane sores. Latent stage: No symptoms. Tertiary stage (years later, if untreated): Serious damage to the heart, brain, nerves, and other organs.',
        es: 'Etapa primaria: Una sola llaga indolora en el lugar de la infección, que dura de 3 a 6 semanas. Etapa secundaria (3-6 semanas después): Sarpullido en la piel (a menudo en las palmas y plantas), síntomas similares a la gripe, llagas en las membranas mucosas. Etapa latente: Sin síntomas. Etapa terciaria (años después, si no se trata): Daños graves al corazón, cerebro, nervios y otros órganos.',
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
        en: 'Use condoms consistently during all sexual activity. Regular testing — especially if you have new or multiple partners — is essential for early detection. If pregnant, get tested for syphilis at the first prenatal visit. Doxycycline post-exposure prophylaxis (doxy-PEP) is an emerging option for high-risk individuals — talk to a doctor.',
        es: 'Use condones de forma consistente durante toda la actividad sexual. Las pruebas regulares son esenciales para la detección temprana. Si está embarazada, hágase la prueba de sífilis en la primera visita prenatal. La profilaxis post-exposición con doxiciclina (doxy-PEP) es una opción emergente para personas de alto riesgo: hable con un médico.',
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
        en: 'Acute HIV (2–4 weeks after infection): Flu-like symptoms — fever, chills, rash, night sweats, muscle aches, sore throat, fatigue, swollen lymph nodes. These symptoms last 2–4 weeks then go away. Chronic HIV: No symptoms for years. AIDS: Rapid weight loss, recurring fever, extreme fatigue, swollen lymph glands, chronic diarrhea, pneumonia.',
        es: 'VIH agudo (2-4 semanas después de la infección): Síntomas similares a la gripe: fiebre, escalofríos, sarpullido, sudores nocturnos, dolores musculares, dolor de garganta, fatiga, ganglios linfáticos inflamados. Estos síntomas duran 2-4 semanas y luego desaparecen. VIH crónico: Sin síntomas durante años. SIDA: Pérdida rápida de peso, fiebre recurrente, fatiga extrema.',
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
        en: 'Highly effective prevention options: PrEP (daily pill or long-acting injection reduces HIV risk by up to 99%), condoms (reduce risk by ~99% when used correctly), and treatment as prevention (U=U). PEP (post-exposure prophylaxis) can prevent HIV if started within 72 hours of exposure. Regular testing enables early treatment.',
        es: 'Opciones de prevención muy eficaces: PrEP (pastilla diaria o inyección de acción prolongada reduce el riesgo de VIH hasta en un 99%), condones (reducen el riesgo en ~99% cuando se usan correctamente) y tratamiento como prevención (I=I). La PEP (profilaxis post-exposición) puede prevenir el VIH si se inicia dentro de las 72 horas posteriores a la exposición.',
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
        en: 'Many people with herpes have no or very mild symptoms. When symptoms occur: Painful blisters or sores on or around the genitals, buttocks, thighs, or mouth; flu-like symptoms during the first outbreak (fever, swollen lymph nodes). Recurrences are typically milder and shorter. The first outbreak can occur 2–12 days after exposure.',
        es: 'Muchas personas con herpes no tienen síntomas o los tienen muy leves. Cuando los síntomas ocurren: ampollas o llagas dolorosas en o alrededor de los genitales, glúteos, muslos o boca; síntomas similares a la gripe durante el primer brote (fiebre, ganglios linfáticos inflamados). Las recurrencias suelen ser más leves y más cortas.',
      },
      testing: {
        en: 'The most accurate testing is a swab of an active sore sent for culture or PCR. Blood tests (HSV IgG antibody tests) can detect herpes without symptoms but have limitations: they cannot tell where infection is located, HSV-1 vs HSV-2 distinction matters for context, and false positives occur. The CDC does not recommend routine blood testing for people without symptoms.',
        es: 'La prueba más precisa es un hisopo de una llaga activa enviado para cultivo o PCR. Las pruebas de sangre (pruebas de anticuerpos IgG del VHS) pueden detectar el herpes sin síntomas, pero tienen limitaciones: no pueden indicar dónde está la infección, la distinción VHS-1 vs VHS-2 importa para el contexto, y pueden ocurrir falsos positivos.',
      },
      treatment: {
        en: 'There is no cure for herpes, but antiviral medications (acyclovir, valacyclovir, famciclovir) can: shorten outbreaks, reduce severity of symptoms, and reduce the frequency of recurrences. Daily suppressive therapy (taking antivirals every day) reduces transmission risk by about 50% and is recommended for people with frequent outbreaks or who want to protect partners.',
        es: 'No existe cura para el herpes, pero los medicamentos antivirales (aciclovir, valaciclovir, famciclovir) pueden: acortar los brotes, reducir la gravedad de los síntomas y reducir la frecuencia de las recurrencias. La terapia supresora diaria (tomar antivirales todos los días) reduce el riesgo de transmisión en aproximadamente un 50% y se recomienda para personas con brotes frecuentes.',
      },
      prevention: {
        en: 'Use condoms or dental dams during sexual activity. Avoid sex during outbreaks or when you feel one starting (prodrome symptoms). Daily suppressive antiviral therapy reduces transmission risk. Disclose herpes status to partners before sexual contact — this is both respectful and, in some places, legally required. Having herpes does not mean you can\'t have fulfilling relationships.',
        es: 'Use condones o barreras dentales durante la actividad sexual. Evite las relaciones sexuales durante los brotes o cuando sienta que uno está comenzando. La terapia antiviral supresora diaria reduce el riesgo de transmisión. Revele su estado de herpes a sus parejas antes del contacto sexual. Tener herpes no significa que no pueda tener relaciones satisfactorias.',
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
    windowPeriod: {
      minDays: 0,
      maxDays: 0,
      noStandardTest: true,
      note: {
        en: 'No routine test for most people; cervical screening (Pap/HPV test) available for people with a cervix',
        es: 'Sin prueba rutinaria para la mayoría; tamizaje cervical (Pap/VPH) disponible para personas con cuello uterino',
      },
    },
  },

  hepatitis_b: {
    slug: 'hepatitis_b',
    title: { en: 'Hepatitis B', es: 'Hepatitis B' },
    windowPeriod: {
      minDays: 30,
      maxDays: 60,
      note: {
        en: 'Blood test for HBsAg (surface antigen); vaccine-preventable',
        es: 'Prueba de sangre para HBsAg (antígeno de superficie); prevenible con vacuna',
      },
    },
  },

  hepatitis_c: {
    slug: 'hepatitis_c',
    title: { en: 'Hepatitis C', es: 'Hepatitis C' },
    windowPeriod: {
      minDays: 56,
      maxDays: 77,
      note: {
        en: 'Blood test (HCV antibody); window period is 8–11 weeks',
        es: 'Prueba de sangre (anticuerpo VHC); el período de ventana es de 8 a 11 semanas',
      },
    },
  },

  trichomoniasis: {
    slug: 'trichomoniasis',
    title: { en: 'Trichomoniasis', es: 'Tricomoniasis' },
    windowPeriod: {
      minDays: 5,
      maxDays: 28,
      note: {
        en: 'NAAT or wet prep; most common curable STI',
        es: 'NAAT o preparación en fresco; ITS curable más común',
      },
    },
  },

  mycoplasma_genitalium: {
    slug: 'mycoplasma_genitalium',
    title: { en: 'Mycoplasma genitalium', es: 'Mycoplasma genitalium' },
    windowPeriod: {
      minDays: 14,
      maxDays: 21,
      note: {
        en: 'NAAT test; not all clinics offer routine testing',
        es: 'Prueba NAAT; no todas las clínicas ofrecen pruebas rutinarias',
      },
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
