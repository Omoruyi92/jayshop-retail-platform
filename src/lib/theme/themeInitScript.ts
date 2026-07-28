import { ALL_THEME_CLASSES, DEFAULT_THEME, THEME_CLASS } from './themes'
import { THEME_STORAGE_KEY } from './ThemeContext'

/**
 * Source for the blocking inline script injected into <head> by the root
 * layout. Runs synchronously during HTML parsing — before React hydrates and
 * before first paint — so a returning visitor with a non-default theme never
 * sees a flash of the default theme. Must stay dependency-free (no imports
 * survive into the emitted string) and must never throw: a corrupt/blocked
 * localStorage read here would otherwise white-screen the whole app before
 * React even mounts.
 *
 * Kept as a plain string (not eval'd JSON) so it can run before any JS
 * bundle is fetched.
 */
export function getThemeInitScript(): string {
  const themeClasses = JSON.stringify(ALL_THEME_CLASSES)
  const classByTheme = JSON.stringify(THEME_CLASS)
  const defaultTheme = JSON.stringify(DEFAULT_THEME)
  const storageKey = JSON.stringify(THEME_STORAGE_KEY)

  return `(function(){
    try {
      var classByTheme = ${classByTheme};
      var allClasses = ${themeClasses};
      var defaultTheme = ${defaultTheme};
      var isAdmin = location.pathname.indexOf('/admin') === 0;
      var stored = null;
      try { stored = localStorage.getItem(${storageKey}); } catch (e) {}
      var theme = (!isAdmin && stored && Object.prototype.hasOwnProperty.call(classByTheme, stored))
        ? stored
        : defaultTheme;
      var root = document.documentElement;
      for (var i = 0; i < allClasses.length; i++) { root.classList.remove(allClasses[i]); }
      root.classList.add(classByTheme[theme]);
    } catch (e) {
      // Fail safe: never block first paint, default CSS (:root) already
      // matches the default theme even if this script throws.
    }
  })();`
}
