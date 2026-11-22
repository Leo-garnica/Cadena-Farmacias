function commerceUrl(raw: string | undefined, role: string): URL | null {
  try {
    const url = new URL(raw ?? '')
    if (url.protocol !== 'postgresql:' || url.host !== '127.0.0.1:55432' ||
        url.pathname !== '/vitafarma_comercio' || url.username !== role ||
        !url.password || url.search || url.hash) return null
    return url
  } catch {
    return null
  }
}

export function localCommerceWriter(env: NodeJS.ProcessEnv): URL | null {
  if (env.VITAFARMA_COMERCIO_LOCAL !== '1' || env.SUPABASE_URL !== 'http://127.0.0.1:55433' ||
      !commerceUrl(env.DATABASE_URL, 'vf_lector')) return null
  return commerceUrl(env.VITAFARMA_PRACTICA_WRITE_URL, 'vf_gestion')
}
