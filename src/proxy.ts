import { type NextRequest, NextResponse, URLPattern } from "next/server"

import { redis, redisKey } from "@/lib/redis"

export default async function middleware(req: NextRequest) {
	const url = new URL(req.url)

	const pattern = new URLPattern({ pathname: "/room/:roomId" })
	const match = pattern.exec(url)
	if (!match) {
		return NextResponse.redirect(new URL("/", req.url))
	}

	const roomId = match.pathname.groups.roomId as string
	const roomKey = redisKey("room", roomId)

	const connected = await redis.hget<string[]>(roomKey, "connected")

	if (!connected) {
		const redirectUrl = new URL("/", req.url)
		redirectUrl.searchParams.set("error", "invalid-room-id")
		return NextResponse.redirect(redirectUrl)
	}

	// if user does not belongs to the room
	const userId = req.cookies.get("x-user-id")?.value as string
	if (!connected.includes(userId)) {
		const redirectUrl = new URL("/", req.url)
		redirectUrl.searchParams.set("error", "unauthorized")
		return NextResponse.redirect(redirectUrl)
	}

	const response = NextResponse.next()
	return response
}

export const config = {
	matcher: "/room/:path*",
}
