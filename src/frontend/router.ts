import type { PocketRoute } from '../types.js'
import { normalizePocketRoute } from '../domain/navigation.js'

function sameRoute(left: PocketRoute, right: PocketRoute): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export class PocketRouteHistory {
  private entries: PocketRoute[] = []
  current: PocketRoute = { app: 'home' }

  navigate(routeInput: PocketRoute, replace = false): PocketRoute {
    const route = normalizePocketRoute(routeInput)
    if (sameRoute(route, this.current)) return this.current
    if (!replace) this.entries.push(this.current)
    this.current = route
    return route
  }

  /**
   * Commit a successful child flow onto its destination without leaving a
   * duplicate copy of that destination immediately underneath in history.
   *
   * Example:
   * Contacts -> Detail -> Edit -> settle(Detail) -> Back returns to Contacts.
   */
  settle(routeInput: PocketRoute): PocketRoute {
    const route = normalizePocketRoute(routeInput)
    if (sameRoute(route, this.current)) return this.current
    const parent = this.entries.at(-1)
    if (parent && sameRoute(parent, route)) this.entries.pop()
    this.current = route
    return route
  }

  back(): PocketRoute {
    this.current = this.entries.pop() || { app: 'home' }
    return this.current
  }

  home(): PocketRoute {
    this.entries = []
    this.current = { app: 'home' }
    return this.current
  }

  reset(route: PocketRoute = { app: 'home' }): PocketRoute {
    this.entries = []
    this.current = normalizePocketRoute(route)
    return this.current
  }

  get canGoBack(): boolean { return this.entries.length > 0 || this.current.app !== 'home' }
}
