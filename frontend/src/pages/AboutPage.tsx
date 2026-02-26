import { ContentPage } from '../components/layout/ContentPage';

export function AboutPage() {
  return (
    <ContentPage
      seoTitle="About — Navilla"
      seoDescription="Learn why Navilla exists, what problem it solves, and who it's built for."
      canonical="https://www.navilla.app/about"
      title="About Navilla"
      subtitle="Why we built this, and who we built it for."
      sections={[
        {
          heading: 'The problem',
          body: [
            'Sexual health decisions are often made with incomplete, delayed, or confusing information. People need practical guidance, but they also need privacy.',
            'Most tools force a bad tradeoff: either share too much personal data, or get almost no useful context.',
          ],
        },
        {
          heading: 'What Navilla is',
          body: [
            'Navilla is a private sexual health companion. It combines educational tools with privacy-first network context so people can decide what to do next with less guesswork.',
            'The core principle is unchanged: numbers, not names.',
          ],
        },
        {
          heading: 'What exists today',
          list: [
            'Public STI guides and a window-period calculator',
            'Private account with profile, connections, and health status management',
            'Aggregated network exposure context with privacy safeguards',
            'Bilingual experience (English/Spanish)',
          ],
        },
        {
          heading: 'What we are building next',
          list: [
            'Stronger timing context and recency handling in exposure interpretation',
            'Clearer confidence labels, including future verification tiers',
            'Improved privacy controls and retention options',
            'Better clinic/testing pathways and educational depth',
          ],
        },
        {
          heading: 'Who it\'s for',
          body: [
            'Navilla is for adults (18+) who want to make informed sexual health decisions without exposing themselves or others.',
            'It is designed for people who value both discretion and actionable information.',
          ],
          note: 'Navilla is an 18+ platform. Health data on minors introduces significant legal complexity that we are not equipped to handle responsibly. We enforce this limit at registration.',
        },
        {
          heading: 'Our principles',
          list: [
            'Privacy is not a feature — it is the foundation. We build every decision around it.',
            'We show you what you need, nothing more. Minimum data, maximum utility.',
            'We are not a social network. There is no public profile, no follower count, no feed.',
            'We are not a medical service. We provide exposure signals, not diagnoses or medical advice.',
          ],
        },
        {
          heading: 'Get in touch',
          body: 'Questions, concerns, partnerships, or product feedback: contact@navilla.app.',
        },
      ]}
    />
  );
}
