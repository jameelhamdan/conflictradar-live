import type { ReactNode } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import SubscribePopup from "./SubscribePopup";
import constants from "@/constants";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  activePage?: string;
  children?: ReactNode;
  showNav?: boolean;
}

export function SiteHeader({ activePage, children, showNav = true }: SiteHeaderProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="flex h-11 flex-shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-card px-4">
      <a href="/" className="ltr flex flex-shrink-0 items-center no-underline">
        <span className="text-[0.95rem] font-bold tracking-tight text-foreground">conflictradar</span>
        <span className="text-[0.95rem] font-bold tracking-tight text-[#e05252]">.live</span>
      </a>

      {/* Middle slot: flex spacer on plain pages, time filters + toggle on main page */}
      {children ?? <div className="flex-1" />}

      {showNav && (
        <>
          <SubscribePopup />
          <NavLink
            to="/newsletter"
            className={({ isActive }) =>
              cn(
                "flex-shrink-0 rounded px-[0.45rem] py-[0.2rem] text-[0.8rem] font-medium no-underline transition-colors",
                isActive || activePage === "newsletter"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {t.newsletter}
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              cn(
                "flex-shrink-0 rounded px-[0.45rem] py-[0.2rem] text-[0.8rem] font-medium no-underline transition-colors",
                isActive || activePage === "about" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {t.about}
          </NavLink>
        </>
      )}

      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        title={lang === "en" ? "Switch to Arabic" : "Switch to English"}
        className="flex-shrink-0 cursor-pointer rounded-full border border-border bg-secondary px-[0.55rem] py-[0.18rem] text-[0.78rem] font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-secondary/80"
      >
        {lang === "en" ? "ع" : "EN"}
      </button>

      <span className="flex-shrink-0 font-mono text-[0.7rem] text-muted-foreground/50">v{constants.VERSION}</span>
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
  const links = [
    {
      href: "/terms",
      label: t.termsLink,
    },
    {
      href: "/privacy",
      label: t.privacyLink,
    },
    {
      href: "/about",
      label: t.about,
    },
  ];

  return (
    <footer className="flex flex-wrap gap-5 border-t border-[#1a1a26] pt-5 pr-8 pb-5 pl-8 text-[0.78rem] text-[#44445a] no-underline">
      {links.map(({ href, label }) => (
        <NavLink
          key={href}
          to={href}
          className={({ isActive }) =>
            `transition-colors hover:text-foreground ${isActive ? "font-medium text-foreground" : ""}`
          }
        >
          {label}
        </NavLink>
      ))}
    </footer>
  );
}

interface PageLayoutProps {
  children: ReactNode;
  activePage?: string;
}

export function PageLayout({ children, activePage }: PageLayoutProps) {
  return (
    <div className="text-text-primary min-h-screen bg-background">
      <SiteHeader activePage={activePage} />
      <main className="mx-auto max-w-xl" style={{ flex: 1 }}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
