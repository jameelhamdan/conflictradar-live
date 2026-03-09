import App from '../components/App'
import { LanguageProvider } from '../contexts/LanguageContext'

export default function HomePage() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  )
}

export const getConfig = async () => ({ render: 'static' as const })
