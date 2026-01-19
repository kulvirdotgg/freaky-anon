import { type NextRequest, NextResponse, URLPattern } from "next/server"

import { redis, redisKey } from "@/lib/redis"

export const proxy = async (req: NextRequest) => {
	const url = new URL("/", req.url)

	const pattern = new URLPattern({ pathname: "/room/:roomId" })
	const match = pattern.exec(url)
	if (!match) {
		return NextResponse.redirect(new URL("/", url))
	}

	const roomId = match.pathname.groups.roomId as string
	const roomKey = redisKey("room", roomId)

	const connected = await redis.hget<string[]>(roomKey, "connected")
	const authToken = req.cookies.get("x-auth-token")?.value as string

	// if room does not exist KEKW
	if (!connected) {
		url.searchParams.set("error", "invalid-room-id")
		return NextResponse.redirect(url)
	}

	// if user does not belongs to the room
	if (!connected.includes(authToken)) {
		url.searchParams.set("error", "unauthorized")
		return NextResponse.redirect(url)
	}

	const response = NextResponse.next()

	return response
}

export const config = {
	matcher: "/room/:path*",
}
