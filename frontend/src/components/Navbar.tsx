import { Menu, Moon, PenLine, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const THEME_KEY = "inkdoc:theme";
const LINKS = [
  { to: "/convert", label: "Convert" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
];

function linkClass({ isActive }: { isActive: boolean }): string {
  const base = "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  return isActive
    ? `${base} bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200`
    : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white`;
}

export function Navbar() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // Private mode can block storage; the theme still applies for this visit.
    }
  }, [dark]);

  const ThemeIcon = dark ? Sun : Moon;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6" aria-label="Main">
        <Link to="/" className="mr-auto flex items-center gap-2 rounded-lg font-serif text-xl font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
            <PenLine className="size-4" aria-hidden />
          </span>
          InkDoc
        </Link>
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <button
          type="button"
          className="btn-icon btn-ghost"
          onClick={() => setDark((d) => !d)}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <ThemeIcon className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          className="btn-icon btn-ghost sm:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </nav>
      {menuOpen && (
        <div id="mobile-menu" className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 sm:hidden dark:border-slate-800">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
