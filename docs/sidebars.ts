import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/overview',
        'getting-started/setup',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/system-design',
        'architecture/data-model',
        'architecture/privacy-model',
        'architecture/security',
        'architecture/infrastructure',
        'architecture/lab-integration',
      ],
    },
    {
      type: 'category',
      label: 'Design',
      collapsed: false,
      items: [
        'design/overview',
        'design/brand-identity',
      ],
    },
    {
      type: 'category',
      label: 'Product',
      items: [
        'product/exposure-transparency',
        'product/platform-recommendations',
        'product/feature-ideas',
        'product/vision-verified-health-platform',
      ],
    },
    {
      type: 'category',
      label: 'Backend',
      items: [
        'backend/overview',
        'backend/project-structure',
        'backend/authentication',
        'backend/database',
        'backend/services',
        'backend/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'frontend/overview',
        'frontend/project-structure',
        'frontend/components',
        'frontend/state-management',
        'frontend/styling',
        'frontend/i18n',
        'frontend/visualization-engine',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/contributing',
        'development/code-style',
        'development/dev-tools',
        'development/testing',
        'development/deployment',
      ],
    },
    {
      type: 'category',
      label: 'Onboarding',
      items: [
        'onboarding/new-hire',
        'onboarding/codebase-tour',
        'onboarding/first-task',
      ],
    },
    {
      type: 'category',
      label: 'ADRs',
      items: [
        'adrs/index',
        'adrs/adr-001-documentation-platform',
        'adrs/adr-002-tech-stack',
        'adrs/adr-005-design-system',
        'adrs/adr-006-auth-email-confirmation',
        'adrs/adr-007-icon-set',
        'adrs/adr-008-network-graph-engine',
        'adrs/adr-010-railway-memory-optimization',
        'adrs/adr-011-domain-navilla-app',
        'adrs/adr-012-browser-native-language-detection',
        'adrs/adr-013-metrics-observability',
      ],
    },
  ],
  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/overview',
        'api/authentication',
        'api/users',
        'api/connections',
        'api/health-status',
        'api/exposures',
        'api/catalog',
        'api/reciprocity',
        'api/phone-matching',
        'api/lab-verification',
        'api/notifications',
        'api/journal',
        'api/health-log',
        'api/medications',
        'api/vaccinations',
        'api/reminders',
        'api/insights',
      ],
    },
  ],
};

export default sidebars;
