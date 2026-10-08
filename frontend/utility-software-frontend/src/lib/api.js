const BASE = import.meta.env.VITE_API_URL || ''

async function http(path, options = {}) {
  let res
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw {
      status: 0,
      message: 'Cannot reach the server. Check that the backend is running on port 8081.',
    }
  }

  if (res.status === 204) return null
  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw {
      status: res.status,
      message: body?.message || res.statusText,
      fieldErrors: body?.fieldErrors,
      body,
    }
  }
  return body
}

export const api = {
  sendRequest: (payload) =>
    http('/api/request/send', { method: 'POST', body: JSON.stringify(payload) }),
  getHistory: () => http('/api/history'),
  getHistoryItem: (id) => http(`/api/history/${id}`),
  deleteHistory: (id) => http(`/api/history/${id}`, { method: 'DELETE' }),
  getMeters: () => http('/api/meters'),
  refreshMeters: () => http('/api/meters/refresh', { method: 'POST' }),
}
