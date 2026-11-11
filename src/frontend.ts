import { bindFrontendUuid } from './domain/uuid.js'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { setupPhone } from './frontend/controller.js'
import { PHONE_STYLES } from './styles.js'

export function setup(ctx: SpindleFrontendContext): () => void {
  const removeStyle = ctx.dom.addStyle(PHONE_STYLES)
  const unbindUuid = bindFrontendUuid(ctx)
  try {
    const destroyPhone = setupPhone(ctx)
    return () => {
      unbindUuid()
      try { destroyPhone() } finally { removeStyle() }
    }
  } catch (error) {
    unbindUuid()
    removeStyle()
    throw error
  }
}
