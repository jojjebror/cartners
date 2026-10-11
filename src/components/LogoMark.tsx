import type { SVGProps } from 'react'
import { LOGO_DRAWING } from '../../shared/constants'

const { viewBox, badge, cart, check, colors } = LOGO_DRAWING

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={viewBox} aria-hidden="true" {...props}>
      <rect width={badge.size} height={badge.size} rx={badge.rx} fill={colors.badge} />
      {cart.wheels.map((x) => (
        <circle key={x} cx={x} cy={cart.wheelY} r={cart.wheelRadius} fill={colors.paper} />
      ))}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={cart.frame} stroke={colors.paper} strokeWidth={cart.width} />
        <path d={check.d} stroke={colors.badge} strokeWidth={check.outline} />
        <path d={check.d} stroke={colors.check} strokeWidth={check.width} />
      </g>
    </svg>
  )
}
