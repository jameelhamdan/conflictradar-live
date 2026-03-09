import NewsletterPage from "../../components/newsletter/NewsletterPage";
import { LanguageProvider } from "../../contexts/LanguageContext";

export default function Page() {
  return <LanguageProvider><NewsletterPage /></LanguageProvider>;
}

export const getConfig = async () => ({ render: "static" as const });
