const applicationLogs: Array<{
  timestamp: number
  level: string
  message: string
  [key: string]: any
}> = []

export function isWatchmanDisabled(): boolean {
  return process.env.WATCHMAN_OFF === 'true' || process.env.WATCHMAN_OFF === '1'
}

export function logInfo(message: string, context?: any) {
  if (isWatchmanDisabled()) return
  applicationLogs.push({ timestamp: Date.now(), level: 'INFO', message, ...context })
}

export function logWarn(message: string, context?: any) {
  if (isWatchmanDisabled()) return
  applicationLogs.push({ timestamp: Date.now(), level: 'WARNING', message, ...context })
}

export function logError(message: string, context?: any) {
  if (isWatchmanDisabled()) return
  applicationLogs.push({ timestamp: Date.now(), level: 'ERROR', message, ...context })
}

export function logDebug(message: string, context?: any) {
  if (isWatchmanDisabled()) return
  applicationLogs.push({ timestamp: Date.now(), level: 'DEBUG', message, ...context })
}

export function getAndClearLogs() {
  const logs = [...applicationLogs]
  applicationLogs.length = 0
  return logs
}

export interface IngestPayload {
  id: string
  createdAt: number
  method: string
  url: string
  status: number
  durationMs: number
  product: string
  request: {
    headers: Record<string, string>
    query?: Record<string, string>
    body?: any
    cookies?: Record<string, string>
    ip: string
  }
  response: {
    headers: Record<string, string>
    body: any
    cookies?: Record<string, string>
  }
  userAgent: string
  userId: string
  serverLogs: {
    timestamp: number
    level: string
    message: string
    [key: string]: any
  }[]
  userDetails: {
    id: string
    email: string
    name: string
    role: string
    status: string
    createdAt: string
    lastLogin: string
    profile: {
      avatar: string
      bio: string
      location: string
      website: string
    }
    preferences: {
      theme: string
      notifications: {
        email: boolean
        push: boolean
        sms: boolean
      }
      language: string
      timezone: string
    }
    subscription: {
      plan: string
      status: string
      expiresAt: string | null
    }
    permissions: string[]
  }
}

export async function sendToWatchman(payload: IngestPayload): Promise<void> {
  try {
    if (isWatchmanDisabled()) return

    const baseUrl = process.env.NEXT_PUBLIC_WATCHMAN_BASE_URL || ''
    if (!baseUrl) {
      console.warn('WATCHMAN_BASE_URL not configured')
      return
    }

    const apiEndpoint = `${baseUrl}/api/ingest/${payload.product}`
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.warn(`Watchman API call failed: ${response.status}`)
    }
  } catch (error) {
    console.warn('Watchman API call failed:', error)
  }
}

export function createWatchmanAnalyticsPayload(
  request: Request,
  response: Response,
  startTime: number,
  requestBody?: any,
  responseBody?: any,
  userData?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    fullName?: string
  }
): IngestPayload {
  const now = Date.now()
  const id = `req_${now}_${Math.random().toString(36).substr(2, 9)}`
  const duration = now - startTime

  const requestHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    requestHeaders[key] = String(value)
  })

  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = String(value)
  })

  return {
    id,
    createdAt: now,
    method: request.method,
    url: request.url,
    status: response.status,
    durationMs: duration,
    product: 'tabs-editor-tool',
    request: {
      headers: requestHeaders,
      body: requestBody,
      cookies: undefined,
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    },
    response: {
      headers: responseHeaders,
      body: responseBody,
      cookies: undefined,
    },
    userAgent: request.headers.get('user-agent') || 'unknown',
    userId: userData?.id || 'anonymous',
    serverLogs: getAndClearLogs(),
    userDetails: {
      id: userData?.id || 'anonymous',
      email: userData?.email || 'unknown@example.com',
      name:
        userData?.fullName ||
        (userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : '') ||
        userData?.firstName ||
        'Anonymous User',
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      profile: { avatar: '', bio: '', location: '', website: '' },
      preferences: {
        theme: 'light',
        notifications: { email: false, push: false, sms: false },
        language: 'en',
        timezone: 'UTC',
      },
      subscription: { plan: 'free', status: 'active', expiresAt: null },
      permissions: [],
    },
  }
}
