import { useTranslation } from 'react-i18next';
import type { STIContent } from '../../lib/stiContent';

interface Props {
  facts: STIContent['facts'];
}

export function FactChips({ facts }: Props) {
  const { t } = useTranslation();

  const typeKey = {
    bacterial: 'guide.factBacterial',
    viral: 'guide.factViral',
    parasitic: 'guide.factParasitic',
  }[facts.type];

  return (
    <div className="fact-chips">
      <span className={`fact-chip fact-chip--${facts.type}`}>
        {t(typeKey, facts.type)}
      </span>
      <span className={`fact-chip ${facts.curable ? 'fact-chip--curable' : 'fact-chip--lifelong'}`}>
        {facts.curable
          ? t('guide.factCurable', 'Curable')
          : t('guide.factLifelong', 'Lifelong')}
      </span>
      {facts.vaccine && (
        <span className="fact-chip fact-chip--vaccine">
          {t('guide.factVaccine', 'Vaccine available')}
        </span>
      )}
    </div>
  );
}
