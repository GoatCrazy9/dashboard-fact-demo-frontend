import type { FC, ReactElement, ReactNode } from 'react'
import { isValidElement } from 'react'
import type { ButtonProps as AriaButtonProps, LinkProps as AriaLinkProps } from 'react-aria-components'
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components'
import { cn } from '@/shared/utils/cn'
import { isReactComponent } from '@/shared/utils/is-react-component'

export const styles = {
  common: {
    root: [
      'group relative inline-flex h-max cursor-pointer items-center justify-center whitespace-nowrap outline-brand transition duration-100 ease-linear before:absolute focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '*:data-icon:pointer-events-none *:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:transition-inherit-all',
    ].join(' '),
    icon: 'pointer-events-none size-5 shrink-0 transition-inherit-all',
  },
  sizes: {
    xs: {
      root: [
        'gap-1 rounded-md px-2 py-1 text-xs font-semibold before:rounded-[5px] data-icon-only:p-1.5',
      ].join(' '),
      linkRoot: 'gap-1 *:data-text:underline-offset-2',
    },
    sm: {
      root: [
        'gap-1 rounded-lg px-3 py-2 text-sm font-semibold before:rounded-[7px] data-icon-only:p-2',
      ].join(' '),
      linkRoot: 'gap-1 *:data-text:underline-offset-3',
    },
    md: {
      root: [
        'gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold before:rounded-[7px] data-icon-only:p-2.5',
      ].join(' '),
      linkRoot: 'gap-1 *:data-text:underline-offset-4',
    },
  },
  colors: {
    primary: {
      root: [
        'bg-brand-solid text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset hover:bg-brand-solid_hover data-loading:bg-brand-solid_hover',
        'before:absolute before:inset-px before:border before:border-white/12 before:mask-b-from-0%',
        '*:data-icon:text-white/60 hover:*:data-icon:text-white/70',
      ].join(' '),
    },
    secondary: {
      root: [
        'bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset hover:bg-primary_hover hover:text-secondary_hover data-loading:bg-primary_hover',
        '*:data-icon:text-fg-quaternary hover:*:data-icon:text-fg-quaternary_hover',
      ].join(' '),
    },
    tertiary: {
      root: [
        'text-tertiary hover:bg-primary_hover hover:text-tertiary_hover data-loading:bg-primary_hover',
        '*:data-icon:text-fg-quaternary hover:*:data-icon:text-fg-quaternary_hover',
      ].join(' '),
    },
    'link-color': {
      root: [
        'justify-normal rounded p-0! text-brand-secondary hover:text-brand-secondary_hover',
        '*:data-text:underline *:data-text:decoration-transparent hover:*:data-text:decoration-fg-brand-secondary_alt',
        '*:data-icon:text-fg-brand-secondary_alt hover:*:data-icon:text-fg-brand-secondary_hover',
      ].join(' '),
    },
    'link-gray': {
      root: [
        'justify-normal rounded p-0! text-tertiary hover:text-tertiary_hover',
        '*:data-text:underline *:data-text:decoration-transparent hover:*:data-text:decoration-fg-quaternary',
        '*:data-icon:text-fg-quaternary hover:*:data-icon:text-fg-quaternary_hover',
      ].join(' '),
    },
    'primary-destructive': {
      root: [
        'bg-error-solid text-white shadow-xs-skeuomorphic ring-1 ring-transparent outline-error ring-inset hover:bg-error-solid_hover data-loading:bg-error-solid_hover',
        'before:absolute before:inset-px before:border before:border-white/12 before:mask-b-from-0%',
        '*:data-icon:text-white/60 hover:*:data-icon:text-white/70',
      ].join(' '),
    },
    'secondary-destructive': {
      root: [
        'bg-primary text-error-primary shadow-xs-skeuomorphic ring-1 ring-error_subtle outline-error ring-inset hover:bg-error-primary hover:text-error-primary_hover data-loading:bg-error-primary',
        '*:data-icon:text-fg-error-secondary hover:*:data-icon:text-fg-error-primary',
      ].join(' '),
    },
    'tertiary-destructive': {
      root: [
        'text-error-primary outline-error hover:bg-error-primary hover:text-error-primary_hover data-loading:bg-error-primary',
        '*:data-icon:text-fg-error-secondary hover:*:data-icon:text-fg-error-primary',
      ].join(' '),
    },
    'link-destructive': {
      root: [
        'justify-normal rounded p-0! text-error-primary outline-error hover:text-error-primary_hover',
        '*:data-text:underline *:data-text:decoration-transparent *:data-text:underline-offset-2 hover:*:data-text:decoration-current',
        '*:data-icon:text-fg-error-secondary hover:*:data-icon:text-fg-error-primary',
      ].join(' '),
    },
  },
} as const

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'xs' | 'sm' | 'md'

const VARIANT_MAP: Record<Variant, keyof typeof styles.colors> = {
  primary: 'primary',
  outline: 'secondary',
  ghost: 'tertiary',
  danger: 'primary-destructive',
}

const SIZE_MAP: Record<Size, keyof typeof styles.sizes> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
}

export interface CommonProps {
  isDisabled?: boolean
  isLoading?: boolean
  loading?: boolean
  size?: keyof typeof styles.sizes | Size
  color?: keyof typeof styles.colors | Variant
  variant?: Variant
  iconLeading?: FC<{ className?: string }> | ReactNode
  startIcon?: ReactNode
  iconTrailing?: FC<{ className?: string }> | ReactNode
  endIcon?: ReactNode
  noTextPadding?: boolean
  showTextWhileLoading?: boolean
  fullWidth?: boolean
  children?: ReactNode
  className?: string
}

export interface ButtonProps extends CommonProps, Omit<AriaButtonProps, 'children' | 'className'> {}
interface LinkProps extends CommonProps, Omit<AriaLinkProps, 'children' | 'className'> {
  href: NonNullable<AriaLinkProps['href']>
}

export type Props = ButtonProps | LinkProps

export const Button: {
  (props: LinkProps): ReactElement<LinkProps>
  (props: ButtonProps): ReactElement<ButtonProps>
} = ({
  size: sizeProp = 'md',
  color: colorProp,
  variant,
  children,
  className,
  noTextPadding,
  iconLeading: IconLeadingProp,
  startIcon,
  iconTrailing: IconTrailingProp,
  endIcon,
  isDisabled: disabledProp,
  isLoading: loadingProp,
  loading,
  showTextWhileLoading,
  fullWidth,
  ...props
}) => {
  const href = 'href' in props ? (props.href as string | undefined) : undefined

  const sizeKey = (SIZE_MAP[sizeProp as Size] || (sizeProp as keyof typeof styles.sizes)) as keyof typeof styles.sizes
  const mappedColor = variant ? VARIANT_MAP[variant] : colorProp
  const colorKey = (mappedColor || 'primary') as keyof typeof styles.colors

  const IconLeading = (startIcon as any) ?? IconLeadingProp
  const IconTrailing = (endIcon as any) ?? IconTrailingProp

  const isIcon = (IconLeading || IconTrailing) && !children
  const isLinkType = ['link-gray', 'link-color', 'link-destructive'].includes(String(colorKey))

  noTextPadding = isLinkType || noTextPadding

  const isLoading = loadingProp ?? loading
  const isDisabled = disabledProp

  const commonChildren = (
    <>
      {isValidElement(IconLeading) && IconLeading}
      {isReactComponent(IconLeading) && <IconLeading data-icon="leading" className={styles.common.icon} />}

      {isLoading && (
        <svg
          fill="none"
          data-icon="loading"
          viewBox="0 0 20 20"
          className={cn(
            styles.common.icon,
            !showTextWhileLoading && 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          )}
        >
          <circle className="stroke-current opacity-30" cx="10" cy="10" r="8" fill="none" strokeWidth="2" />
          <circle
            className="origin-center animate-spin stroke-current"
            cx="10"
            cy="10"
            r="8"
            fill="none"
            strokeWidth="2"
            strokeDasharray="12.5 50"
            strokeLinecap="round"
          />
        </svg>
      )}

      {children && (
        <span data-text className={cn('transition-inherit-all', !noTextPadding && 'px-0.5')}>
          {children}
        </span>
      )}

      {isValidElement(IconTrailing) && IconTrailing}
      {isReactComponent(IconTrailing) && <IconTrailing data-icon="trailing" className={styles.common.icon} />}
    </>
  )

  const commonProps: any = {
    'data-loading': isLoading ? true : undefined,
    'data-icon-only': isIcon ? true : undefined,
    ...props,
    isDisabled,
    className: cn(
      styles.common.root,
      styles.sizes[sizeKey].root,
      styles.colors[colorKey].root,
      isLinkType && styles.sizes[sizeKey].linkRoot,
      (isLoading || (href && isDisabled)) && 'pointer-events-none',
      fullWidth && 'w-full',
      isLoading &&
        (showTextWhileLoading
          ? '[&>*:not([data-icon=loading]):not([data-text])]:hidden'
          : '[&>*:not([data-icon=loading])]:invisible'),
      className,
    ),
    children: commonChildren,
  }

  if ('href' in commonProps || href !== undefined) {
    return <AriaLink {...commonProps} href={isDisabled ? undefined : href} />
  }

  return <AriaButton {...commonProps} type={commonProps.type || 'button'} isPending={isLoading} />
}