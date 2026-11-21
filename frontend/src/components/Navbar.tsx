import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const THEME_KEY = "inkdoc:theme";
const LINKS = [
  { to: "/convert", label: "Convert" },
  { to: "/history", label: "Documents" },
  { to: "/about", label: "About" },
];

function linkClass({ isActive }: { isActive: boolean }): string {
  const base = "border-b-2 py-1 text-sm transition-colors";
  return isActive ? `${base} border-accent text-ink` : `${base} border-transparent text-ink-2 hover:text-ink`;
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
    <header className="sticky top-0 z-40 border-b border-rule bg-paper">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6" aria-label="Main">
        <Link to="/" className="mr-auto font-serif text-2xl leading-none tracking-tight">
          InkDoc<span className="text-accent">.</span>
        </Link>
        <div className="hidden items-center gap-7 sm:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="-mr-2 flex items-center">
          <button type="button" className="btn-ghost p-2" onClick={() => setDark((d) => !d)} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            <ThemeIcon className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="btn-ghost p-2 sm:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="size-5" strokeWidth={1.75} aria-hidden /> : <Menu className="size-5" strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div id="mobile-menu" className="flex flex-col gap-3 border-t border-rule px-4 py-4 sm:hidden">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `${linkClass({ isActive })} self-start`}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
