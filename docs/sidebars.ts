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
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/contributing',
        'development/code-style',
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
      ],
    },
  ],
};

export default sidebars;
