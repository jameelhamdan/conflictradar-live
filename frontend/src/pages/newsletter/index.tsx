import NewsletterPage from "../../components/newsletter/NewsletterPage";

export default function Page() {
  return <NewsletterPage />;
}

export const getConfig = async () => ({ render: "static" as const });
