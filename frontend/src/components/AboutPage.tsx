import React from 'react';
import { useTranslation } from 'react-i18next';

const APP_VERSION  = '2.0';
const RELEASE_YEAR = '2024';
const LAST_UPDATED = 'June 2026';

// ── Tech stack — names are brand names (not translated);
//    category labels and notes come from the locale. ─────────────────────────

interface TechItem { name: string; noteKey: string; }
interface TechGroup { catKey: string; color: string; items: TechItem[]; }

const STACK: TechGroup[] = [
  {
    catKey: 'catFrontend', color: 'blue',
    items: [
      { name: 'React 18',        noteKey: 'noteReact'    },
      { name: 'TypeScript 4.9',  noteKey: 'noteTs'       },
      { name: 'Vite 7',          noteKey: 'noteVite'     },
      { name: 'Tailwind CSS 3',  noteKey: 'noteTailwind' },
      { name: 'React Router 6',  noteKey: 'noteRouter'   },
    ],
  },
  {
    catKey: 'catApi', color: 'fuchsia',
    items: [
      { name: 'GraphQL 16',      noteKey: 'noteGraphql'      },
      { name: 'Apollo Client 3', noteKey: 'noteApolloClient' },
      { name: 'Apollo Server 4', noteKey: 'noteApolloServer' },
    ],
  },
  {
    catKey: 'catBackend', color: 'amber',
    items: [
      { name: 'Node.js',   noteKey: 'noteNode'    },
      { name: 'Express 4', noteKey: 'noteExpress' },
    ],
  },
  {
    catKey: 'catDatabase', color: 'emerald',
    items: [
      { name: 'PostgreSQL', noteKey: 'notePostgres' },
      { name: 'Prisma 6',   noteKey: 'notePrisma'   },
    ],
  },
  {
    catKey: 'catAuth', color: 'red',
    items: [
      { name: 'JSON Web Tokens', noteKey: 'noteJwt'       },
      { name: 'bcryptjs',        noteKey: 'noteBcrypt'    },
      { name: 'express-rate-limit', noteKey: 'noteRateLimit' },
    ],
  },
  {
    catKey: 'catMedia', color: 'purple',
    items: [
      { name: 'Cloudinary',  noteKey: 'noteCloudinary'  },
      { name: 'Nodemailer',  noteKey: 'noteNodemailer'  },
      { name: 'node-cron',   noteKey: 'noteCron'        },
    ],
  },
  {
    catKey: 'catCross', color: 'indigo',
    items: [
      { name: 'Capacitor 6', noteKey: 'noteCapacitor' },
      { name: 'Electron',    noteKey: 'noteElectron'  },
    ],
  },
  {
    catKey: 'catDataI18n', color: 'teal',
    items: [
      { name: 'Chart.js 4 + Recharts', noteKey: 'noteCharts' },
      { name: 'i18next',               noteKey: 'noteI18n'   },
      { name: 'QRCode.react',          noteKey: 'noteQr'     },
    ],
  },
];

const CHIP: Record<string, string> = {
  blue:    'bg-blue-100    dark:bg-blue-900/30    text-blue-700    dark:text-blue-300    border border-blue-200    dark:border-blue-800',
  fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800',
  amber:   'bg-amber-100   dark:bg-amber-900/30   text-amber-700   dark:text-amber-300   border border-amber-200   dark:border-amber-800',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  red:     'bg-red-100     dark:bg-red-900/30     text-red-700     dark:text-red-300     border border-red-200     dark:border-red-800',
  purple:  'bg-purple-100  dark:bg-purple-900/30  text-purple-700  dark:text-purple-300  border border-purple-200  dark:border-purple-800',
  indigo:  'bg-indigo-100  dark:bg-indigo-900/30  text-indigo-700  dark:text-indigo-300  border border-indigo-200  dark:border-indigo-800',
  teal:    'bg-teal-100    dark:bg-teal-900/30    text-teal-700    dark:text-teal-300    border border-teal-200    dark:border-teal-800',
};

const HDR: Record<string, string> = {
  blue:    'bg-blue-600    dark:bg-blue-800',
  fuchsia: 'bg-fuchsia-600 dark:bg-fuchsia-800',
  amber:   'bg-amber-500   dark:bg-amber-700',
  emerald: 'bg-emerald-600 dark:bg-emerald-800',
  red:     'bg-red-600     dark:bg-red-800',
  purple:  'bg-purple-600  dark:bg-purple-800',
  indigo:  'bg-indigo-600  dark:bg-indigo-800',
  teal:    'bg-teal-600    dark:bg-teal-800',
};

// ── Component ────────────────────────────────────────────────────────────────

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const SKILLS = ['skill1','skill2','skill3','skill4','skill5','skill6'] as const;
  const TAGS   = ['tag1','tag2','tag3','tag4','tag5','tag6','tag7','tag8','tag9','tag10','tag11'] as const;

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-8">

      {/* ── Page header ── */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('about.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base">
          {t('about.subtitle')}
        </p>
        <div className="mt-3 inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>{t('about.released', { year: RELEASE_YEAR })}</span>
          <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">v{APP_VERSION}</span>
          <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span>{t('about.updatedOn', { date: LAST_UPDATED })}</span>
        </div>
      </div>

      {/* ── Developer card ── */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden">

        {/* Profile header */}
        <div className="bg-emerald-600 dark:bg-emerald-700 p-6 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/60 flex-shrink-0">
              <img
                src="/images/photo_2024-09-11_12-30-18.jpg"
                alt="Kris David Steeve Ella"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold">Kris David Steeve Ella</h2>
              <p className="text-emerald-100 text-sm font-medium mb-3">
                {t('about.devTitle')}
              </p>
              <p className="text-sm text-emerald-50 leading-relaxed max-w-2xl">
                {t('about.devBio')}
              </p>
            </div>
          </div>
        </div>

        {/* Experience + Education */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Professional experience */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
              {t('about.sectionExperience')}
            </h3>

            <div className="mb-6">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {t('about.job1Title')}
                </h4>
                <span className="text-xs text-white bg-emerald-600 dark:bg-emerald-700 px-3 py-0.5 rounded-full whitespace-nowrap">
                  {t('about.job1Period')}
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                {t('about.job1Company')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('about.job1Desc')}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {t('about.job2Title')}
                </h4>
                <span className="text-xs text-white bg-emerald-600 dark:bg-emerald-700 px-3 py-0.5 rounded-full whitespace-nowrap">
                  {t('about.job2Period')}
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                {t('about.job2Company')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('about.job2Desc')}
              </p>
            </div>
          </div>

          {/* Education & skills */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
              {t('about.sectionEducation')}
            </h3>

            <div className="mb-4">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {t('about.edu1Title')}
                </h4>
                <span className="text-xs text-white bg-emerald-600 dark:bg-emerald-700 px-3 py-0.5 rounded-full whitespace-nowrap">
                  {t('about.edu1Period')}
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                {t('about.edu1School')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('about.edu1Desc')}
              </p>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {t('about.edu2Title')}
                </h4>
                <span className="text-xs text-white bg-emerald-600 dark:bg-emerald-700 px-3 py-0.5 rounded-full whitespace-nowrap">
                  {t('about.edu2Period')}
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                {t('about.edu2School')}
              </p>
            </div>

            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
              {t('about.sectionSkills')}
            </h4>
            <ul className="grid grid-cols-2 gap-1.5 text-sm text-gray-600 dark:text-gray-300 mb-4">
              {SKILLS.map(key => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {t(`about.${key}`)}
                </li>
              ))}
            </ul>

            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
              {t('about.sectionLanguages')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('about.languagesList')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tech stack ── */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('about.stackTitle')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('about.stackSubtitle')}
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STACK.map(group => (
            <div key={group.catKey} className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className={`${HDR[group.color]} px-3 py-2`}>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t(`about.${group.catKey}`)}
                </span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {group.items.map(item => (
                  <li key={item.name} className="px-3 py-2">
                    <span className={`inline-block text-xs font-semibold rounded px-1.5 py-0.5 mb-0.5 ${CHIP[group.color]}`}>
                      {item.name}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {t(`about.${item.noteKey}`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── About Libroware ── */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
          {t('about.appTitle')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
          {t('about.appP1')}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {t('about.appP2')}
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(key => (
            <span key={key} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
              {t(`about.${key}`)}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
