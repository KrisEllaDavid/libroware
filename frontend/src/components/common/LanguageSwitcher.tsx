import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => changeLanguage("en")}
        className={`px-2 py-1 rounded ${
          i18n.language === "en"
            ? "bg-emerald-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage("fr")}
        className={`px-2 py-1 rounded ${
          i18n.language === "fr"
            ? "bg-emerald-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        }`}
      >
        FR
      </button>
    </div>
  );
};

export default LanguageSwitcher;
