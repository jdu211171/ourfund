import { useOptionalAppNavigation } from '../navigation'
import { en } from './en'
import { ja } from './ja'

export { en, ja }
export const translations = ja

export function translate(key: string, lang: 'en' | 'ja' = 'en'): string {
  if (lang === 'ja' && ja[key]) {
    return ja[key]
  }
  return key
}

export function useTranslation() {
  const nav = useOptionalAppNavigation()
  const lang = nav?.language || 'en'

  return {
    t: (key: string) => translate(key, lang),
    language: lang
  }
}
