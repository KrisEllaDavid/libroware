import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, Icon, ShelfBand, Tag, TagTone } from './ui';

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

/**
 * Each stack group gets an icon rather than its own colour.
 *
 * The previous version painted eight coloured headers — blue, fuchsia, amber,
 * emerald, red, purple, indigo, teal — across a single grid, which turned the
 * page's densest block into the loudest thing in the product. Colour now means
 * what it means everywhere else in the app; the grouping is carried by
 * position and a glyph.
 */
const GROUP_ICON: Record<string, string> = {
  catFrontend: 'grid',
  catApi: 'arrowRight',
  catBackend: 'settings',
  catDatabase: 'list',
  catAuth: 'shield',
  catMedia: 'upload',
  catCross: 'globe',
  catDataI18n: 'chart',
};

// ── Component ────────────────────────────────────────────────────────────────

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const SKILLS = ['skill1','skill2','skill3','skill4','skill5','skill6'] as const;
  const TAGS   = ['tag1','tag2','tag3','tag4','tag5','tag6','tag7','tag8','tag9','tag10','tag11'] as const;

  /** A dated entry in the experience or education column. */
  const Entry: React.FC<{
    title: string;
    org: string;
    period: string;
    desc?: string;
  }> = ({ title, org, period, desc }) => (
    <li className="relative pl-5">
      {/* Timeline rail: a marker and a line, so a column of roles reads as a
          sequence rather than four disconnected blocks. */}
      <span
        className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-950"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 left-[3px] top-5 w-px bg-gray-200 last:hidden dark:bg-gray-800"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {period}
        </span>
      </div>
      <p className="mt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        {org}
      </p>
      {desc && (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {desc}
        </p>
      )}
    </li>
  );

  return (
    <div className="app-shell page max-w-5xl">
      {/* ── Page header ── */}
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {t('about.title')}
        </h1>
        <p className="mx-auto mt-2 max-w-prose text-base leading-relaxed text-gray-500 dark:text-gray-400">
          {t('about.subtitle')}
        </p>
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <span>{t('about.released', { year: RELEASE_YEAR })}</span>
          <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            v{APP_VERSION}
          </span>
          <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
          <span>{t('about.updatedOn', { date: LAST_UPDATED })}</span>
        </div>
      </header>

      {/* ── Developer ── */}
      <Card className="overflow-hidden">
        <div className="relative bg-emerald-800 p-6 text-white sm:p-8 dark:bg-emerald-900">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-20 sm:block"
            aria-hidden="true"
          >
            <ShelfBand className="h-full w-full" />
          </div>

          <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start">
            <img
              src="/images/photo_2024-09-11_12-30-18.jpg"
              alt="Kris David Steeve Ella"
              className="h-28 w-28 shrink-0 rounded-2xl border-4 border-white/50 object-cover shadow-lg sm:h-32 sm:w-32"
            />
            <div className="text-center md:text-left">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Kris David Steeve Ella
              </h2>
              <p className="mt-0.5 text-sm font-medium text-emerald-200">
                {t('about.devTitle')}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/90">
                {t('about.devBio')}
              </p>
            </div>
          </div>
        </div>

        <CardBody className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Experience */}
          <section>
            <h3 className="mb-4 border-b border-gray-200 pb-2 font-display text-base font-semibold tracking-tight text-gray-900 dark:border-gray-800 dark:text-white">
              {t('about.sectionExperience')}
            </h3>
            <ul className="space-y-6">
              <Entry
                title={t('about.job1Title')}
                org={t('about.job1Company')}
                period={t('about.job1Period')}
                desc={t('about.job1Desc')}
              />
              <Entry
                title={t('about.job2Title')}
                org={t('about.job2Company')}
                period={t('about.job2Period')}
                desc={t('about.job2Desc')}
              />
            </ul>
          </section>

          {/* Education & skills */}
          <section>
            <h3 className="mb-4 border-b border-gray-200 pb-2 font-display text-base font-semibold tracking-tight text-gray-900 dark:border-gray-800 dark:text-white">
              {t('about.sectionEducation')}
            </h3>
            <ul className="space-y-6">
              <Entry
                title={t('about.edu1Title')}
                org={t('about.edu1School')}
                period={t('about.edu1Period')}
                desc={t('about.edu1Desc')}
              />
              <Entry
                title={t('about.edu2Title')}
                org={t('about.edu2School')}
                period={t('about.edu2Period')}
              />
            </ul>

            <h4 className="mb-2.5 mt-6 text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('about.sectionSkills')}
            </h4>
            <ul className="grid grid-cols-1 gap-1.5 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
              {SKILLS.map(key => (
                <li key={key} className="flex items-start gap-2">
                  <Icon
                    name="check"
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  {t(`about.${key}`)}
                </li>
              ))}
            </ul>

            <h4 className="mb-1.5 mt-6 text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('about.sectionLanguages')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('about.languagesList')}
            </p>
          </section>
        </CardBody>
      </Card>

      {/* ── Tech stack ── */}
      <Card>
        <CardHeader
          title={t('about.stackTitle')}
          description={t('about.stackSubtitle')}
        />
        <CardBody className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {STACK.map(group => (
            <section key={group.catKey}>
              <h3 className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2 text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <Icon
                  name={(GROUP_ICON[group.catKey] ?? 'grid') as any}
                  size={14}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                {t(`about.${group.catKey}`)}
              </h3>
              <ul className="space-y-2.5">
                {group.items.map(item => (
                  <li key={item.name}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                      {t(`about.${item.noteKey}`)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </CardBody>
      </Card>

      {/* ── About Libroware ── */}
      <Card>
        <CardHeader title={t('about.appTitle')} />
        <CardBody>
          <div className="max-w-prose space-y-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <p>{t('about.appP1')}</p>
            <p>{t('about.appP2')}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {TAGS.map(key => (
              <Tag key={key} tone="neutral">{t(`about.${key}`)}</Tag>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AboutPage;
