/**
 * Button.jsx — Reusable Button Primitive
 *
 * Profile-adaptive button that adjusts contrast, sizing, and animation
 * based on the active profile's uiPreferences. Supports multiple visual
 * variants and full keyboard accessibility.
 */

import { useProfile } from '../../hooks/useProfile.js'

const VARIANT_CLASSES = {
  primary: {
    base: 'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 focus-visible:ring-primary-400',
    highContrast: 'bg-white text-black hover:bg-gray-200 active:bg-gray-300 border-2 border-white focus-visible:ring-white',
  },
  secondary: {
    base: 'bg-surface-800 text-surface-50 border border-surface-600 hover:bg-surface-700 active:bg-surface-600 focus-visible:ring-surface-400',
    highContrast: 'bg-black text-white border-2 border-white hover:bg-gray-900 active:bg-gray-800 focus-visible:ring-white',
  },
  danger: {
    base: 'bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-700 focus-visible:ring-danger-400',
    highContrast: 'bg-danger-500 text-white border-2 border-white hover:bg-danger-400 focus-visible:ring-white',
  },
  ghost: {
    base: 'bg-transparent text-surface-200 hover:bg-surface-800/50 active:bg-surface-700/50 focus-visible:ring-surface-400',
    highContrast: 'bg-transparent text-white border border-white hover:bg-white/10 focus-visible:ring-white',
  },
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
}

/**
 * @param {Object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {React.ReactNode} [props.icon] – Optional leading icon element.
 * @param {string} [props.className] – Additional CSS classes.
 * @param {React.ReactNode} props.children
 * @param {Object} props.rest – Spread to the underlying <button>.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  className = '',
  children,
  ...rest
}) {
  const { uiPreferences } = useProfile()
  const { highContrast, largeText, reduceMotion } = uiPreferences

  const variantConfig = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
  const colorClass = highContrast ? variantConfig.highContrast : variantConfig.base

  // Bump size up one step when largeText is active
  const effectiveSize = largeText
    ? (size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'lg')
    : size

  const classes = [
    // Base styles
    'inline-flex items-center justify-center font-semibold rounded-xl',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
    // Transition (disabled when reduceMotion is active)
    reduceMotion ? '' : 'transition-colors duration-150',
    // Size
    SIZE_CLASSES[effectiveSize],
    // Color variant
    colorClass,
    // Width
    fullWidth ? 'w-full' : '',
    // Disabled state
    (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    // User overrides
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span
          className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full ${reduceMotion ? '' : 'animate-spin'}`}
          aria-hidden="true"
        />
      ) : icon ? (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
