# Internationalization (i18n)

HabitSync's UI is localized with [`react-i18next`](https://react.i18next.com/).
Language strings live in JSON files under [`locales/`](./locales), one file per
language. The active language is auto-detected from the device/browser locale
([`expo-localization`](https://docs.expo.dev/versions/latest/sdk/localization/))
and can be changed by the user in **Profile → Language**. The choice is
persisted with `AsyncStorage`.

## Currently supported languages

| Code | Language |
|------|----------|
| `en` | English (source / fallback) |
| `de` | Deutsch |

## Using translations in code

```tsx
import {useTranslation} from 'react-i18next';

const MyComponent = () => {
    const {t} = useTranslation();
    return <Text>{t('namespace.key')}</Text>;
};
```

- Keys are grouped into namespaces (one per screen/component, e.g. `login`,
  `profile`, `habitConfig`), plus a shared `common` namespace for generic words
  (`common.ok`, `common.cancel`, `common.save`, …).
- Interpolation uses `{{var}}`:
  `t('profile.invitationFrom', {name})` ↔ `"Invitation from {{name}}"`.

## Adding a new language

1. Copy `locales/en.json` to `locales/<code>.json` (e.g. `locales/fr.json`) and
   translate every value. **Keep the keys unchanged** — only translate the
   values. English is the fallback, so any missing key shows the English text.
2. Register the language in [`index.ts`](./index.ts):
   ```ts
   import fr from './locales/fr.json';

   export const resources = {
       en: {translation: en},
       de: {translation: de},
       fr: {translation: fr},
   } as const;

   export const SUPPORTED_LANGUAGES = ['en', 'de', 'fr'] as const;

   export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
       en: 'English',
       de: 'Deutsch',
       fr: 'Français',
   };
   ```
3. That's it — the new language appears in the **Profile → Language** switcher
   and is auto-selected for users whose device locale matches.

## Keeping locales in sync

`en.json` is the source of truth. When you add a new English string, add the
same key to every other locale file. The two existing files have identical key
sets; please keep new languages in parity to avoid fallback gaps.
