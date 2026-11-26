import type { ReactNode } from 'react'
import { Checkbox as AriaCheckbox } from 'react-aria-components'
import { cn } from '@/shared/utils/cn'
import { useDensity } from './density'

interface CheckboxProps {
  label: ReactNode
  hint?: ReactNode
  size?: 'sm' | 'md'
  className?: string
  isSelected?: boolean
  isDisabled?: boolean
  onChange?: (isSelected: boolean) => void
}

/** Checkbox accesible con el mismo patrón visual que dojo. */
export function Checkbox({
  label,
  hint,
  size = 'sm',
  className,
  isSelected,
  isDisabled,
  onChange,
}: CheckboxProps) {
  const compact = useDensity() === 'compact'

  return (
    <AriaCheckbox
      isSelected={isSelected}
      isDisabled={isDisabled}
      onChange={onChange}
      className={cn(
        'relative flex cursor-pointer items-start gap-2',
        size === 'md' && 'gap-3',
        isDisabled && 'cursor-not-allowed',
        className,
      )}
    >
      {({ isSelected: selected, isIndeterminate, isDisabled: disabled, isFocusVisible }) => (
        <>
          <span
            className={cn(
              'relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-primary ring-1 ring-primary ring-inset',
              size === 'md' && 'size-5 rounded-md',
              (selected || isIndeterminate) && 'bg-brand-solid ring-brand-solid',
              disabled && 'cursor-not-allowed opacity-50',
              isFocusVisible && 'outline-2 outline-offset-2 outline-focus-ring',
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 14 14"
              fill="none"
              className={cn(
                'pointer-events-none absolute size-3 text-white opacity-0',
                selected && !isIndeterminate && 'opacity-100',
              )}
            >
              <path
                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="inline-flex flex-col">
            <span
              className={cn(
                'font-medium text-secondary select-none',
                compact ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-base',
              )}
            >
              {label}
            </span>
            {hint && (
              <span className={cn(compact ? 'text-[11px]' : 'text-xs', 'text-tertiary')}>{hint}</span>
            )}
          </span>
        </>
      )}
    </AriaCheckbox>
  )
}
