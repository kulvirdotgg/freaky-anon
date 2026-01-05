import { nanoid } from "nanoid"
import { type NextRequest, NextResponse } from "next/server"

import { env } from "@/server/utils/env"
import { genRedisKey, redis } from "@/server/utils/redis"

export const proxy = async (req: NextRequest) => {
	const pathname = req.nextUrl.pathname

	const roomMatch = pathname.match(/^\/room\/([^/]+)$/)
	if (!roomMatch) {
		return NextResponse.redirect(new URL("/", req.url))
	}

	// roomId user is tyring to connect to
	const roomId = roomMatch[1] as string
	const redisRoomKey = genRedisKey("room", roomId)

	const room = await redis.hgetall<{ connected: string[]; createdAt: number }>(redisRoomKey)
	if (!room) {
		return NextResponse.redirect(new URL("/?error=invalid-room", req.url))
	}

	// if user refresh the page etc, let user join the room again
	const existingAuthToken = req.cookies.get("x-auth-token")?.value
	if (existingAuthToken && room.connected.includes(existingAuthToken)) {
		return NextResponse.next()
	}

	// do not allow more than 2 users in a single room
	if (room.connected.length >= 2) {
		return NextResponse.redirect(new URL("/?error=room-full", req.url))
	}

	const response = NextResponse.next()

	const authToken = nanoid()
	response.cookies.set("x-auth-token", authToken, {
		path: "/",
		secure: env.NODE_ENV === "production",
		sameSite: "strict",
		httpOnly: true,
	})

	await redis.hset(redisRoomKey, {
		connected: [...room.connected, authToken],
	})

	return response
}

export const config = {
	matcher: "/room/:path*",
}
