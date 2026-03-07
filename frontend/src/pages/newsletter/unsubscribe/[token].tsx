import UnsubscribeClient from '../../../components/newsletter/UnsubscribeClient'

export default function UnsubscribePage() {
  return <UnsubscribeClient />
}

export const getConfig = async () => ({ render: 'dynamic' as const })
