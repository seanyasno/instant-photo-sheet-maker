import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '#/components/ui/button'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * Runs inline in <head> before first paint, so a saved dark theme never flashes
 * light. Light is the default: only an explicit saved "dark" turns it on.
 */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem('${STORAGE_KEY}')==='dark')document.documentElement.classList.add('dark')}catch(e){}`

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage blocked (private mode etc.): the toggle still works for this visit.
  }
}

export function ThemeToggle() {
  // Prerendered HTML is always light; sync with what the init script applied.
  const [theme, setTheme] = useState<Theme>('light')
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    )
  }, [])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => {
        applyTheme(next)
        setTheme(next)
      }}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
