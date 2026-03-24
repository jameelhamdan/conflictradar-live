import { useEffect } from "react";
import constants from "@/constants";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${constants.SITE_TITLE}` : constants.SITE_TITLE;
    return () => {
      document.title = constants.SITE_TITLE;
    };
  }, [title]);
}
