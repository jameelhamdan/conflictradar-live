export default {
  // @ts-expect-error - this is injected by Vite at build time
  VERSION: __APP_VERSION__,
  BASE_URL: import.meta.env.VITE_DOMAIN || "http://localhost:8000",
  GA_ID: import.meta.env.VITE_GA_ID as string | undefined,
}
