import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('settings.languageOptions.english'), flag: '🇺🇸' },
    { code: 'ru', name: t('settings.languageOptions.russian'), flag: '🇷🇺' },
    { code: 'kk', name: t('settings.languageOptions.kazakh'), flag: '🇰🇿' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        type="button"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      <div className="absolute right-0 z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
        <div className="py-1" role="listbox" aria-labelledby="language-switcher">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`w-full text-left px-4 py-2 text-sm ${
                i18n.language === language.code
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => i18n.changeLanguage(language.code)}
              role="option"
              aria-selected={i18n.language === language.code}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;