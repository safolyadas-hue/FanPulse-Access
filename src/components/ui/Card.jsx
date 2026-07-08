/**
 * Card.jsx — Reusable Glass-Morphism Card Primitive
 *
 * Adaptive card container that adjusts its glass effect, border, and
 * padding based on the active profile's uiPreferences.
 */

import { useProfile } from '../../hooks/useProfile.js'

/**
 * @param {Object} props
 * @param {string}  [props.className]  – Additional CSS classes.
 * @param {boolean} [props.noPadding=false] – Skip default padding.
 * @param {boolean} [props.hoverable=false] – Add hover lift effect.
 * @param {'sm'|'md'|'lg'} [props.padding='md'] – Padding size.
 * @param {string}  [props.role]       – ARIA role override.
 * @param {string}  [props.ariaLabel]  – Accessible label.
 * @param {React.ReactNode} props.children
 */
export default function Card({
  className = '',
  noPadding = false,
  hoverable = false,
  padding = 'md',
  role,
  ariaLabel,
  children,
  ...rest
}) {
  const { uiPreferences } = useProfile()
  const { highContrast, reduceMotion } = uiPreferences

  const paddingSizes = {
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-7',
  }

  const classes = [
    // Glass-morphism base
    highContrast
      ? 'bg-black border-2 border-white'
      : 'bg-surface-800/60 backdrop-blur-xl border border-surface-700/50',
    // Shape
    'rounded-2xl',
    // Padding
    noPadding ? '' : (paddingSizes[padding] || paddingSizes.md),
    // Hover effect (respects reduceMotion)
    hoverable && !reduceMotion
      ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/10 transition-transform duration-200'
      : '',
    hoverable && reduceMotion
      ? 'hover:shadow-lg hover:shadow-primary-500/10'
      : '',
    // User overrides
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      role={role}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </div>
  )
}
