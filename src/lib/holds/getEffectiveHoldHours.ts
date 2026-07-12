import type { HoldSettings } from '@prisma/client'

/**
 * Computes the effective hold duration in hours given the current
 * HoldSettings, whether today is a game day, and which pickup path
 * the customer chose (Gate 5 extended-hold counter vs Section 123
 * stadium queue).
 *
 * - Gate 5 (standard) path: gets extended hours when the 48h toggle
 *   is enabled AND today is not a game day; otherwise standard hours.
 * - Section 123 (stadium queue) path: ALWAYS uses standardHoldHours
 *   because it is an express pickup location for stadium visitors.
 */
export function getEffectiveHoldHours(
  settings: Pick<HoldSettings, 'enable48HourHold' | 'standardHoldHours' | 'extendedHoldHours'>,
  gameDay: boolean,
  isStadiumPickup: boolean
): number {
  // Stadium queue is strictly express pickup — always use the shorter duration
  if (isStadiumPickup) return settings.standardHoldHours

  const canUseExtended = settings.enable48HourHold && !gameDay
  return canUseExtended ? settings.extendedHoldHours : settings.standardHoldHours
}
