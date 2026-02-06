/**
 * Logger utility
 * Only logs in development mode
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log('[App]', ...args)
  },
  error: (...args: any[]) => {
    if (isDev) console.error('[Error]', ...args)
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn('[Warning]', ...args)
  },
  info: (...args: any[]) => {
    if (isDev) console.info('[Info]', ...args)
  },
  debug: (...args: any[]) => {
    if (isDev) console.debug('[Debug]', ...args)
  },
}
