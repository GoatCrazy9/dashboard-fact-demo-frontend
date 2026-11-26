import { useTheme } from '@/context/ThemeContext'
import { Icon } from '@/shared/ui/icons'

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const titulo = isDark ? 'Usar tema claro' : 'Usar tema oscuro'

  return (
    <button
      type="button"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      }}
      aria-label={titulo}
      title={titulo}
      className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-tertiary transition duration-100 ease-linear hover:bg-primary_hover hover:text-primary sm:size-10"
    >
      <Icon name={isDark ? 'sun' : 'moon'} className="size-4 sm:size-5" />
    </button>
  )
}
