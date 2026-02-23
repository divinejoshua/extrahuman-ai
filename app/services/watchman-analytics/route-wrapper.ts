import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import {
  createWatchmanAnalyticsPayload,
  sendToWatchman,
  isWatchmanDisabled,
} from './logger'

export function withWatchmanAnalytics<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    if (isWatchmanDisabled()) {
      return await handler(request, ...args)
    }

    const startTime = Date.now()
    let response: Response
    let requestBody: any
    let responseBody: any
    let userData: any = null

    try {
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const requestClone = request.clone()
          const rawRequestBody = await requestClone.text()
          try {
            requestBody = JSON.parse(rawRequestBody)
          } catch {
            requestBody = { raw: rawRequestBody }
          }
        } catch {
          requestBody = null
        }
      }

      try {
        const { userId: clerkUserId } = await auth()
        if (clerkUserId) {
          const clerkClientInstance = await clerkClient()
          const user = await clerkClientInstance.users.getUser(clerkUserId)
          userData = {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName:
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              user.emailAddresses[0]?.emailAddress ||
              'Unknown User',
          }
        }
      } catch {
        // silent fail for user data
      }

      response = await handler(request, ...args)

      try {
        const contentType = response.headers.get('content-type') || ''
        const transferEncoding = response.headers.get('transfer-encoding')

        if (transferEncoding === 'chunked' || contentType.includes('text/plain')) {
          responseBody = {
            message: 'Streaming response detected',
            isStreaming: true,
            contentType,
          }
        } else {
          const responseClone = response.clone()
          responseBody = await responseClone.json()
        }
      } catch {
        responseBody = { message: 'Non-JSON response' }
      }
    } catch (error: any) {
      const errorData = { error: error?.message || 'Internal Server Error' }
      response = NextResponse.json(errorData, { status: 500 })
      responseBody = errorData
    }

    try {
      const payload = createWatchmanAnalyticsPayload(
        request,
        response,
        startTime,
        requestBody,
        responseBody,
        userData
      )
      await sendToWatchman(payload)
    } catch {
      // silent fail for analytics
    }

    return response
  }
}
