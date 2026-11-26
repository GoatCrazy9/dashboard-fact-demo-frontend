import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components'
import { cn } from '@/shared/utils/cn'
import { Icon } from './icons'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
  isDisabled?: boolean
  isRequired?: boolean
  id?: string
  size?: 'sm' | 'md'
  className?: string
  wrapperClassName?: string
  name?: string
}

/** Select de Untitled UI: botón React Aria + listbox, sin <select> nativo. */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  ariaLabel,
  isDisabled,
  isRequired,
  id,
  size = 'md',
  className,
  wrapperClassName,
  name,
}: SelectProps) {
  return (
    <AriaSelect
      id={id}
      name={name}
      isRequired={isRequired}
      aria-label={ariaLabel}
      placeholder={placeholder}
      selectedKey={value || null}
      onSelectionChange={(clave) => {
        if (clave !== null) onChange(String(clave))
      }}
      isDisabled={isDisabled}
      className={cn('w-full min-w-0', wrapperClassName)}
    >
      <AriaButton
        className={cn(
          'relative flex w-full cursor-pointer items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition duration-100 ease-linear ring-inset',
          size === 'sm' ? 'h-8' : 'h-10',
          'data-[focus-visible]:ring-2 data-[focus-visible]:ring-brand',
          'data-[open]:ring-2 data-[open]:ring-brand',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          className,
        )}
      >
        <SelectValue
          className={cn(
            'flex h-full w-full items-center justify-start truncate text-left align-middle px-3 gap-2',
            '*:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:text-fg-quaternary',
          )}
        >
          {({ isPlaceholder, selectedText }) => (
            <>
              <span
                className={cn(
                  'truncate',
                  size === 'sm' ? 'text-sm' : 'text-md',
                  isPlaceholder ? 'text-placeholder' : 'text-primary',
                )}
              >
                {isPlaceholder ? placeholder : selectedText}
              </span>
              <Icon
                name="chevron-down"
                className="ml-auto shrink-0 size-4 text-fg-quaternary stroke-[2.25px]"
              />
            </>
          )}
        </SelectValue>
      </AriaButton>

      <Popover
        className="max-h-72 w-[var(--trigger-width)] min-w-40 overflow-auto rounded-lg bg-primary p-1 shadow-xl ring-1 ring-tertiary ring-inset outline-hidden"
        placement="bottom start"
      >
        <ListBox className="flex flex-col gap-0.5 outline-hidden">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              isDisabled={option.disabled}
              className={cn(
                'flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-secondary outline-hidden transition-colors',
                'data-[hover]:bg-secondary data-[pressed]:bg-secondary',
                'data-[focus-visible]:ring-2 data-[focus-visible]:ring-brand',
                'data-[selected]:bg-brand-primary data-[selected]:font-semibold data-[selected]:text-brand-secondary',
                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
              )}
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}
