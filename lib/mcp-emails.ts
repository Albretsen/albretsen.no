const url = process.env.MCP_EMAILS_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.MCP_EMAILS_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
const table = process.env.MCP_EMAILS_SUPABASE_USERS_TABLE ?? 'users'

/** Returns a production count without ever sending database credentials to the browser. */
export async function getMcpEmailsUserCount(): Promise<number | null> {
  if (!url || !key) return null
  try {
    const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}?select=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact', Range: '0-0' },
      next: { revalidate: 900 },
    })
    const total = response.headers.get('content-range')?.split('/')[1]
    return response.ok && total && /^\d+$/.test(total) ? Number(total) : null
  } catch {
    return null
  }
}
