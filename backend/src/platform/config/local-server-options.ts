/** Only local, synthetic data is served in this foundation. No env files are loaded. */
export function localServerOptions(env: { PORT?: string }) {
  const value = env.PORT ?? '3000'
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535')
  }
  return { host: '127.0.0.1', port: Number(value) }
}
