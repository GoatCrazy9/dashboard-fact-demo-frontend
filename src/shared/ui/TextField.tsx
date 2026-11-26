import type { ReactNode } from 'react'
import type { TextFieldProps as AriaTextFieldProps } from 'react-aria-components'
import {
  Input as AriaInput,
  Label as AriaLabel,
  Text as AriaText,
  TextField as AriaTextField,
} from 'react-aria-components'
import { cn } from '@/shared/utils/cn'
import { RequiredMark } from './RequiredMark'
import { useDensity, type Density } from './density'

interface TextFieldProps
  extends Omit<AriaTextFieldProps, 'children' | 'className' | 'validate' | 'validationBehavior'> {
  label: string
  requiredMark?: boolean
  error?: string
  hint?: string
  placeholder?: string
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  /** Clases extra para el <input>; útil para forzar 16 px en formularios móviles. */
  inputClassName?: string
  className?: string
  wrapperClassName?: string
  /** Máximo de caracteres permitidos en el input. */
  maxLength?: number
  /** Oculta la etiqueta visualmente; se mantiene para lectores de pantalla. */
  hideLabel?: boolean
  /** 'compact' reduce tipografía y espaciado (barras de filtros densas). */
  density?: Density
}

export function TextField({
  label,
  requiredMark = false,
  error,
  hint,
  placeholder,
  startAdornment,
  endAdornment,
  inputClassName,
  isDisabled,
  className,
  wrapperClassName,
  maxLength,
  hideLabel = false,
  density,
  ...rest
}: TextFieldProps) {
  const helperText = error ?? hint
  const inheritedDensity = useDensity()
  const compact = (density ?? inheritedDensity) === 'compact'

  return (
    <AriaTextField
      {...rest}
      isDisabled={isDisabled}
      isRequired={requiredMark}
      isInvalid={Boolean(error)}
      className={cn('group flex w-full flex-col items-start', compact ? 'gap-1' : 'gap-1.5', className)}
    >
      <AriaLabel
        data-label="true"
        className={cn(
          'flex cursor-default items-center gap-0.5 font-medium text-secondary',
          compact ? 'text-xs' : 'text-sm',
          error && 'text-error-primary',
          hideLabel && 'sr-only',
        )}
      >
        {label}
        {requiredMark && <RequiredMark />}
      </AriaLabel>

      <div
        className={cn(
          'relative flex w-full flex-row items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow duration-100 ease-linear focus-within:ring-2 focus-within:ring-brand',
          isDisabled && 'cursor-not-allowed opacity-50',
          error && 'ring-error_subtle focus-within:ring-error',
          wrapperClassName,
        )}
      >
        {startAdornment && (
          <span className={cn('pointer-events-none absolute text-fg-quaternary', compact ? 'left-2.5' : 'left-3')}>{startAdornment}</span>
        )}

        <AriaInput
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'm-0 w-full rounded-lg bg-transparent text-primary ring-0 outline-hidden placeholder:text-placeholder autofill:text-primary',
            compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm',
            startAdornment
              ? (compact ? 'pr-3 pl-8' : 'pr-4 pl-10')
              : (compact ? 'pr-3 pl-2.5' : 'pr-4 pl-3'),
            endAdornment && (compact ? 'pr-9' : 'pr-11'),
            inputClassName,
          )}
        />

        {endAdornment && (
          <span className={cn('absolute flex items-center text-fg-quaternary', compact ? 'right-2.5' : 'right-3')}>{endAdornment}</span>
        )}
      </div>

      {helperText && (
        <AriaText
          slot={error ? 'errorMessage' : 'description'}
          className={cn(compact ? 'text-xs' : 'text-sm', error ? 'text-error-primary' : 'text-tertiary')}
        >
          {helperText}
        </AriaText>
      )}
    </AriaTextField>
  )
}
