import App from '../components/App'

export default function HomePage() {
  return <App />
}

export const getConfig = async () => ({ render: 'static' as const })
