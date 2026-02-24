import { ContentPage } from '../components/layout/ContentPage';

export function AccessibilityPage() {
  return (
    <ContentPage
      seoTitle="Accessibility — Navilla"
      seoDescription="Navilla's commitment to accessibility and how to report accessibility issues."
      canonical="https://www.navilla.app/accessibility"
      title="Accessibility"
      subtitle="Our commitment to an inclusive experience."
      sections={[
        {
          heading: 'Our commitment',
          body: 'Navilla is designed to be usable by as many people as possible. We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. This is an ongoing effort and we welcome feedback.',
        },
        {
          heading: 'What we do',
          list: [
            'Semantic HTML for screen reader compatibility',
            'Keyboard navigation support throughout the application',
            'Sufficient color contrast ratios for text and interactive elements',
            'ARIA labels on icon-only buttons and interactive elements',
            'Focus indicators visible at all times',
            'Screen reader-only text (sr-only) where visual labels are insufficient',
          ],
        },
        {
          heading: 'Known limitations',
          body: 'As an early-stage product, there may be areas of the application that do not yet fully meet our accessibility goals. We are actively working to identify and address these gaps.',
        },
        {
          heading: 'Reporting an issue',
          body: 'If you encounter an accessibility barrier while using Navilla, please let us know. Your feedback helps us prioritize improvements. Contact us at contact@navilla.app with a description of the issue and the page or feature where you experienced it.',
        },
      ]}
    />
  );
}
