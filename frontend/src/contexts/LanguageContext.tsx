'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { UI } from '../i18n/strings'

export type Language = 'en' | 'ar'

interface LanguageContextValue {
  lang: Language
  setLang: (l: Language) => void
  isRTL: boolean
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  isRTL: false,
})

function readLangCookie(): Language | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/)
  const val = match?.[1]
  return val === 'ar' || val === 'en' ? val : null
}

function writeLangCookie(lang: Language) {
  document.cookie = `lang=${lang};path=/;max-age=31536000;SameSite=Lax`
}

function getBrowserLang(): Language {
  if (typeof navigator === 'undefined') return 'en'
  const nav = navigator.language || (navigator.languages?.[0] ?? 'en')
  return nav.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Read the cookie immediately so the correct language is set on the first render,
  // eliminating the flash when navigating between pages.
  const [lang, setLangState] = useState<Language>(
    () => readLangCookie() ?? getBrowserLang()
  )

  // Apply dir + lang attributes to the document root on every change
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  // Only persist to cookie when the user explicitly changes the language
  function setLang(l: Language) {
    setLangState(l)
    writeLangCookie(l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  return { ...ctx, t: UI[ctx.lang] }
}
