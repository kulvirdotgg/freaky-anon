import { type NextRequest, NextResponse, URLPattern } from "next/server"

import { redis, redisKey } from "@/lib/redis"

export const proxy = async (req: NextRequest) => {
	const pattern = new URLPattern({ pathname: "/room/:roomId" })
	const match = pattern.exec(req.nextUrl.href)
	if (!match) {
		return NextResponse.redirect(new URL("/", req.url))
	}

	const roomId = match.pathname.groups.roomId as string

	const roomKey = redisKey("room", roomId)

	const connected = await redis.hget<string[]>(roomKey, "connected")
	const authToken = req.cookies.get("x-auth-token")?.value as string
	if (!connected?.includes(authToken)) {
		return NextResponse.redirect(new URL("/?error=unauthorized", req.url))
	}

	const response = NextResponse.next()

	return response
}

export const config = {
	matcher: "/room/:path*",
}
