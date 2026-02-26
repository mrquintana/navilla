import { ContentPage } from '../components/layout/ContentPage';

export function TermsPage() {
  return (
    <ContentPage
      seoTitle="Terms of Service — Navilla"
      seoDescription="Navilla terms of service. Rules for using the platform and what we are and are not responsible for."
      canonical="https://www.navilla.app/terms"
      title="Terms of Service"
      subtitle="The rules for using Navilla."
      lastUpdated="February 2026"
      sections={[
        {
          heading: 'Who can use Navilla',
          body: 'Navilla is for adults aged 18 and older. By creating an account, you confirm that you are at least 18 years old. We do not knowingly collect data from users under 18. If we become aware that a user is under 18, we will terminate their account.',
        },
        {
          heading: 'What Navilla is',
          body: [
            'Navilla is a private sexual health platform that provides educational content and anonymized network exposure context.',
            'Navilla is informational only. It is not a medical provider, diagnostic tool, emergency service, or substitute for professional medical advice.',
          ],
        },
        {
          heading: 'Your responsibilities',
          list: [
            'You are responsible for the accuracy of any health status you report',
            'You must not create accounts for other people without their knowledge and consent',
            'You must not attempt to identify other users from the anonymized data shown to you',
            'You must not use Navilla to harass, stalk, or harm other users',
            'You must not attempt to reverse-engineer or circumvent our privacy protections',
          ],
        },
        {
          heading: 'Accuracy and limitations',
          body: [
            'Exposure context is only as accurate as underlying reports and network coverage. Missing, delayed, or inaccurate user reports can affect outputs.',
            'A low or zero signal does not prove no exposure. A higher signal does not diagnose infection. Use Navilla as one input among many and seek professional care when needed.',
          ],
        },
        {
          heading: 'Health content scope',
          body: 'Educational content is based on public health sources and plain-language summaries. It is provided for general information and must not be used as a diagnosis or treatment plan.',
        },
        {
          heading: 'External links',
          body: 'Some pages on Navilla may link to external health resources for informational purposes. We do not control external sites and are not responsible for their content, accuracy, or availability. Following external links is your own decision and responsibility.',
        },
        {
          heading: 'Limitation of liability',
          body: 'Navilla is provided as-is. We make no guarantees about uptime, data accuracy, or fitness for any particular purpose. To the maximum extent permitted by law, we are not liable for any harm resulting from your use of or reliance on the platform.',
        },
        {
          heading: 'Changes to these terms',
          body: 'We may update these terms as the product evolves. We will notify users of significant changes via email. Continued use of Navilla after changes are posted constitutes acceptance of the updated terms.',
        },
        {
          heading: 'Contact',
          body: 'Questions about these terms? Write to contact@navilla.app.',
        },
      ]}
    />
  );
}
