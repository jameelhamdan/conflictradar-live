import AboutPage from "../components/AboutPage";

export default function About() {
  return (
    <>
      <title>About — conflictradar.live</title>
      <meta name="description" content="About conflictradar.live — a real-time intelligence platform tracking global conflicts, protests, disasters, and political events using NLP-powered news analysis." />
      <link rel="canonical" href="https://conflictradar.live/about" />
      <meta property="og:title" content="About — conflictradar.live" />
      <meta property="og:description" content="About conflictradar.live — a real-time intelligence platform tracking global conflicts, protests, disasters, and political events using NLP-powered news analysis." />
      <meta property="og:url" content="https://conflictradar.live/about" />
      <AboutPage />
    </>
  );
}

export const getConfig = async () => ({ render: "static" as const });
