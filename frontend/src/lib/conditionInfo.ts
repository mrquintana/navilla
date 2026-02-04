type ConditionLink = {
  label: string;
  url: string;
};

const EN_LINKS: Record<string, ConditionLink> = {
  chlamydia: { label: 'Chlamydia', url: 'https://medlineplus.gov/chlamydiainfections.html' },
  gonorrhea: { label: 'Gonorrhea', url: 'https://medlineplus.gov/gonorrhea.html' },
  syphilis: { label: 'Syphilis', url: 'https://medlineplus.gov/syphilis.html' },
  hiv: { label: 'HIV', url: 'https://medlineplus.gov/hiv.html' },
  hsv1: { label: 'Herpes simplex', url: 'https://medlineplus.gov/herpessimplex.html' },
  hsv2: { label: 'Herpes simplex', url: 'https://medlineplus.gov/herpessimplex.html' },
  hpv: { label: 'HPV', url: 'https://medlineplus.gov/hpv.html' },
  hepatitis_b: { label: 'Hepatitis B', url: 'https://medlineplus.gov/hepatitisb.html' },
  hepatitis_c: { label: 'Hepatitis C', url: 'https://medlineplus.gov/hepatitisc.html' },
  trichomoniasis: { label: 'Trichomoniasis', url: 'https://medlineplus.gov/trichomoniasis.html' },
};

const ES_LINKS: Record<string, ConditionLink> = {
  chlamydia: { label: 'Clamidia', url: 'https://medlineplus.gov/spanish/chlamydiainfections.html' },
  gonorrhea: { label: 'Gonorrea', url: 'https://medlineplus.gov/spanish/gonorrhea.html' },
  syphilis: { label: 'Sífilis', url: 'https://medlineplus.gov/spanish/syphilis.html' },
  hiv: { label: 'VIH', url: 'https://medlineplus.gov/spanish/hiv.html' },
  hsv1: { label: 'Herpes simple', url: 'https://medlineplus.gov/spanish/herpessimplex.html' },
  hsv2: { label: 'Herpes simple', url: 'https://medlineplus.gov/spanish/herpessimplex.html' },
  hpv: { label: 'VPH', url: 'https://medlineplus.gov/spanish/hpv.html' },
  hepatitis_b: { label: 'Hepatitis B', url: 'https://medlineplus.gov/spanish/hepatitisb.html' },
  hepatitis_c: { label: 'Hepatitis C', url: 'https://medlineplus.gov/spanish/hepatitisc.html' },
  trichomoniasis: { label: 'Tricomoniasis', url: 'https://medlineplus.gov/spanish/trichomoniasis.html' },
};

const FALLBACK_EN: ConditionLink = {
  label: 'STIs',
  url: 'https://medlineplus.gov/sexuallytransmitteddiseases.html',
};

const FALLBACK_ES: ConditionLink = {
  label: 'ITS',
  url: 'https://medlineplus.gov/spanish/sexuallytransmittedinfections.html',
};

export function getConditionInfo(condition: string, language: string): ConditionLink {
  const key = condition.toLowerCase();
  if (language.startsWith('es')) {
    return ES_LINKS[key] || FALLBACK_ES;
  }
  return EN_LINKS[key] || FALLBACK_EN;
}
