interface PageMeta {
  name: string;
  description: string;
  url: string;
}

export function buildMedicalWebPageLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name,
    description,
    url,
    medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
    specialty: { '@type': 'MedicalSpecialty', name: 'Infectious Disease' },
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}

export function buildWebApplicationLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}

export function buildCollectionPageLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}

export function buildWebPageLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}
