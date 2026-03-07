import ConfirmClient from '../../../components/newsletter/ConfirmClient'

export default function ConfirmPage() {
  return <ConfirmClient />
}

export const getConfig = async () => ({ render: 'dynamic' as const })
