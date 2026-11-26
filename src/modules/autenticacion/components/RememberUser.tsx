import { Checkbox } from '@/shared/ui/Checkbox'

interface RememberUserProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  showHint?: boolean
}

export function RememberUser({
  checked,
  onChange,
  disabled,
  label = 'Recordarme',
  showHint = true,
}: RememberUserProps) {
  return (
    <Checkbox
      label={label}
      hint={showHint ? 'Guardamos solo tu usuario en este equipo.' : undefined}
      isSelected={checked}
      isDisabled={disabled}
      onChange={onChange}
    />
  )
}
