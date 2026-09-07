import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { setupPhone } from './frontend/controller.js'
import { PHONE_STYLES } from './styles.js'

export function setup(ctx: SpindleFrontendContext): () => void {
  const removeStyle = ctx.dom.addStyle(PHONE_STYLES)
  const destroyPhone = setupPhone(ctx)
  return () => {
    destroyPhone()
    removeStyle()
  }
}
