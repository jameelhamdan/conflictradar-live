import NewsletterDatePage from "../../../../components/newsletter/NewsletterDatePage";
import { LanguageProvider } from "../../../../contexts/LanguageContext";

export default function Page() {
  return <LanguageProvider><NewsletterDatePage /></LanguageProvider>;
}

export const getConfig = async () => ({ render: "dynamic" as const });
