import NewsletterDatePage from "../../../../components/newsletter/NewsletterDatePage";

export default function Page() {
  return <NewsletterDatePage />;
}

export const getConfig = async () => ({ render: "dynamic" as const });
