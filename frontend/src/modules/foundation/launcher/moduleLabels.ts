/** Core directory labels; module-owned descriptions and routes remain the source of truth. */
const labels: Record<string, Record<string, string>> = {
  hi: {
    rooms: 'कमरे',
    rides: 'राइड',
    community: 'समुदाय',
    jobs: 'नौकरियाँ',
    referrals: 'रेफरल',
    events: 'कार्यक्रम',
    marketplace: 'बाज़ार',
    expenses: 'खर्च',
    immigration: 'आप्रवासन',
    utilities: 'सेवाएँ',
    safety: 'सुरक्षा',
    chat: 'चैट',
    assistant: 'सहायक',
  },
  te: {
    rooms: 'గదులు',
    rides: 'రైడ్స్',
    community: 'కమ్యూనిటీ',
    jobs: 'ఉద్యోగాలు',
    referrals: 'రెఫరల్స్',
    events: 'ఈవెంట్స్',
    marketplace: 'మార్కెట్',
    expenses: 'ఖర్చులు',
    immigration: 'ఇమ్మిగ్రేషన్',
    utilities: 'సేవలు',
    safety: 'భద్రత',
    chat: 'చాట్',
    assistant: 'సహాయకుడు',
  },
  ta: {
    rooms: 'அறைகள்',
    rides: 'பயணங்கள்',
    community: 'சமூகம்',
    jobs: 'வேலைகள்',
    referrals: 'பரிந்துரைகள்',
    events: 'நிகழ்வுகள்',
    marketplace: 'சந்தை',
    expenses: 'செலவுகள்',
    immigration: 'குடியேற்றம்',
    utilities: 'சேவைகள்',
    safety: 'பாதுகாப்பு',
    chat: 'உரையாடல்',
    assistant: 'உதவியாளர்',
  },
  kn: {
    rooms: 'ಕೊಠಡಿಗಳು',
    rides: 'ಪ್ರಯಾಣಗಳು',
    community: 'ಸಮುದಾಯ',
    jobs: 'ಉದ್ಯೋಗಗಳು',
    referrals: 'ಶಿಫಾರಸುಗಳು',
    events: 'ಕಾರ್ಯಕ್ರಮಗಳು',
    marketplace: 'ಮಾರುಕಟ್ಟೆ',
    expenses: 'ವೆಚ್ಚಗಳು',
    immigration: 'ವಲಸೆ',
    utilities: 'ಸೇವೆಗಳು',
    safety: 'ಸುರಕ್ಷತೆ',
    chat: 'ಚಾಟ್',
    assistant: 'ಸಹಾಯಕ',
  },
  ml: {
    rooms: 'മുറികൾ',
    rides: 'യാത്രകൾ',
    community: 'കമ്മ്യൂണിറ്റി',
    jobs: 'ജോലികൾ',
    referrals: 'റഫറലുകൾ',
    events: 'പരിപാടികൾ',
    marketplace: 'മാർക്കറ്റ്',
    expenses: 'ചെലവുകൾ',
    immigration: 'കുടിയേറ്റം',
    utilities: 'സേവനങ്ങൾ',
    safety: 'സുരക്ഷ',
    chat: 'ചാറ്റ്',
    assistant: 'സഹായി',
  },
};

const roomWords = [
  'कमरा',
  'कमरे',
  'గది',
  'గదులు',
  'அறை',
  'அறைகள்',
  'வீடுகள்',
  'ಕೊಠಡಿ',
  'ಕೊಠಡಿಗಳು',
  'ಮನೆಗಳು',
  'മുറി',
  'മുറികൾ',
  'വീടുകൾ',
];

/** Native-script searches work in every interface language, including English. */
export function moduleAliases(key: string): string[] {
  return [
    ...Object.values(labels).flatMap((language) => (language[key] ? [language[key]] : [])),
    ...(key === 'rooms' ? roomWords : []),
  ];
}

export function localizedModules<
  T extends { key: string; label: string; keywords?: readonly string[] },
>(modules: readonly T[], language: string) {
  return modules.map((module) => ({
    ...module,
    label: labels[language]?.[module.key] ?? module.label,
    keywords: [...(module.keywords ?? []), module.label, ...moduleAliases(module.key)],
  }));
}
