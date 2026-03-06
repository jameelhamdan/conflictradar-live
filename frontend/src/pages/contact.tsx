import ContactRedirect from '../components/ContactRedirect'

export default function ContactPage() {
  return <ContactRedirect />
}

export const getConfig = async () => ({ render: 'dynamic' as const })
