import { describe, it, expect } from 'vitest';
import {
  buildMedicalWebPageLD,
  buildWebApplicationLD,
  buildCollectionPageLD,
  buildWebPageLD,
} from './structuredData';

describe('structuredData', () => {
  it('buildMedicalWebPageLD returns valid schema', () => {
    const result = buildMedicalWebPageLD({
      name: 'Chlamydia Guide',
      description: 'Everything about chlamydia',
      url: 'https://www.navilla.app/guide/chlamydia',
    });
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('MedicalWebPage');
    expect(result.name).toBe('Chlamydia Guide');
    expect(result.description).toBe('Everything about chlamydia');
    expect(result.url).toBe('https://www.navilla.app/guide/chlamydia');
    expect(result.publisher.name).toBe('Navilla');
  });

  it('buildWebApplicationLD returns valid schema', () => {
    const result = buildWebApplicationLD({
      name: 'Window Period Calculator',
      description: 'Calculate testing windows',
      url: 'https://www.navilla.app/calculator',
    });
    expect(result['@type']).toBe('WebApplication');
    expect(result.applicationCategory).toBe('HealthApplication');
  });

  it('buildCollectionPageLD returns valid schema', () => {
    const result = buildCollectionPageLD({
      name: 'STI Guides',
      description: 'All STI guides',
      url: 'https://www.navilla.app/guides',
    });
    expect(result['@type']).toBe('CollectionPage');
  });

  it('buildWebPageLD returns valid schema', () => {
    const result = buildWebPageLD({
      name: 'Testing Costs',
      description: 'Cost info',
      url: 'https://www.navilla.app/testing-cost',
    });
    expect(result['@type']).toBe('WebPage');
  });
});
