import { ContentPage } from '../components/layout/ContentPage';

export function CareersPage() {
  return (
    <ContentPage
      seoTitle="Careers — Navilla"
      seoDescription="Join the Navilla team. We're building privacy-first health tools for people who care about both."
      canonical="https://www.navilla.app/careers"
      title="Careers"
      subtitle="Help us build the privacy-first health network."
      sections={[
        {
          heading: 'Where we are',
          body: 'Navilla is an early-stage side project with a small, focused team. We don\'t have formal open roles right now, but we are always interested in talking to people who care deeply about privacy, health, and building things that matter.',
        },
        {
          heading: 'What we look for',
          body: 'More than any specific skill, we care about how you think. The right person for Navilla:',
          list: [
            'Thinks about privacy as a design constraint, not a compliance checkbox',
            'Is comfortable with ambiguity and early-stage product work',
            'Can write clearly — code, product thinking, or both',
            'Cares about the people who will use what they build',
            'Has strong opinions but holds them loosely',
          ],
        },
        {
          heading: 'Areas of interest',
          body: 'If we do hire, it will likely be in one of these areas:',
          list: [
            'Full-stack engineering (React, Java/Spring Boot)',
            'Product design (health tech, privacy UX)',
            'Mobile development (React Native or native iOS/Android)',
            'Data and privacy engineering',
          ],
        },
        {
          heading: 'How to reach us',
          body: 'Send an email to contact@navilla.app with the subject line "Careers". Include a short note about what you\'re interested in working on and why Navilla resonates with you. Attach your resume or portfolio. We read everything and respond to everyone who looks like a genuine fit.',
          note: 'We are not currently working with recruiters or staffing agencies.',
        },
      ]}
      footer={
        <div className="card space-y-2">
          <p className="text-sm font-semibold">Ready to reach out?</p>
          <a
            href="mailto:contact@navilla.app?subject=Careers"
            className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
          >
            contact@navilla.app
          </a>
        </div>
      }
    />
  );
}
