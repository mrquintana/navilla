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
            'When someone in your network gets sick, you often find out too late — or not at all. People share health information selectively, privately, and sometimes not at all, because the social cost of disclosure feels too high.',
            'The result is that the people around you are making health decisions without the information they need. You might have changed your behavior, taken a test, or stayed home. You just didn\'t know.',
          ],
        },
        {
          heading: 'What Navilla does',
          body: [
            'Navilla is a private health exposure network. It tells you what\'s circulating in your trusted circle — anonymized, aggregated, and without exposing anyone\'s identity.',
            'You see numbers, not names. You know your exposure level without knowing who is sick. The people in your network never appear by name, health condition, or any personally identifiable detail.',
          ],
        },
        {
          heading: 'How it works',
          body: 'Users connect with people they know and trust. When someone in that network logs a positive health status, Navilla updates the exposure signal for everyone connected to them. No names are shared. No statuses are attributed. Only the aggregate risk signal is visible.',
        },
        {
          heading: 'Who it\'s for',
          body: [
            'Navilla is designed for adults who want to make informed health decisions without compromising their own privacy or anyone else\'s.',
            'The primary audience is people aged 18–35 who are socially active, health-conscious, and already thinking about the people around them.',
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
          body: 'We\'re a small team and we read every message. If you have a question, a concern, or feedback about the product, write to us at contact@navilla.app.',
        },
      ]}
    />
  );
}
