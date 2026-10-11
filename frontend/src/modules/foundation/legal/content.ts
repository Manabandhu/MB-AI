/**
 * Terms of Service and Privacy Policy shown in the app and on the web (/terms, /privacy). Bump the version when
 * the text changes materially; sign-up records the accepted terms version on the account.
 *
 * This text describes what the app actually does today. Have it reviewed by counsel before a store launch, and fill
 * in the operator's legal name and address where marked.
 */
export const TERMS_VERSION = '2026-10-11';

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const termsOfService: LegalDocument = {
  title: 'Terms of Service',
  updated: TERMS_VERSION,
  intro:
    'These terms apply when you use ManaBandhu on the web or in the mobile app. By creating an account you agree to them.',
  sections: [
    {
      heading: 'Your account',
      paragraphs: [
        'You must give accurate details and keep your sign-in secure. You are responsible for what happens under your account.',
        'You can delete your account at any time from Settings → Account & data.',
      ],
    },
    {
      heading: 'Community rules',
      paragraphs: [
        'Be honest and respectful. Do not post scams, fake listings, harassment, hate, or anything illegal.',
        'Room, ride, job, referral, marketplace and event posts are made by members. ManaBandhu does not inspect, guarantee or take part in any arrangement between members. Meet safely and verify before you pay or travel.',
      ],
    },
    {
      heading: 'Content you post',
      paragraphs: [
        'You keep ownership of what you post. You allow ManaBandhu to store and show it to the people it is meant for so the service works.',
        'We may remove content or suspend accounts that break these terms or put members at risk.',
      ],
    },
    {
      heading: 'Information, not advice',
      paragraphs: [
        'Immigration, job and other resources are general information, not legal, financial or professional advice.',
      ],
    },
    {
      heading: 'Changes and ending',
      paragraphs: [
        'We may update these terms; the date above shows the latest version and we will ask you to accept material changes.',
        'The service is provided as is, to the extent the law allows.',
      ],
    },
  ],
};

export const privacyPolicy: LegalDocument = {
  title: 'Privacy Policy',
  updated: TERMS_VERSION,
  intro: 'This explains what ManaBandhu collects, why, who processes it, and the choices you have.',
  sections: [
    {
      heading: 'What we collect',
      paragraphs: [
        'Account details: email or phone number, name, optional nickname and profile photo.',
        'What you create: listings, rides, posts, messages, expenses, RSVPs, applications, reports and settings.',
        'Location: the city you choose, and your device location only when you allow it (for nearby results).',
        'Device: a push notification token when you turn push on.',
      ],
    },
    {
      heading: 'How we use it',
      paragraphs: [
        'To run the features you use, show your posts to the people they are meant for, send the notifications you choose, keep the community safe, and fix problems.',
        'We do not sell your personal information.',
      ],
    },
    {
      heading: 'Who processes it',
      paragraphs: [
        'Supabase hosts sign-in and the database. Expo delivers push notifications. Google Maps provides directions and place search when you use maps.',
      ],
    },
    {
      heading: 'Your choices',
      paragraphs: [
        'Notification settings control what reaches you, including quiet hours.',
        'Settings → Account & data lets you download a copy of your data or delete your account. Deleting removes your account and everything you created (listings, rides, posts, messages); shared expense groups you own pass to another member.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: ['ManaBandhu is not intended for children under 16.'],
    },
    {
      heading: 'Contact',
      paragraphs: ['Questions about privacy can be sent from the Safety center in the app.'],
    },
  ],
};
