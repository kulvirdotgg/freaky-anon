import { nanoid } from "nanoid"
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

	// if user was already part of the room and is trying to rejoin the same room
	const authToken = req.cookies.get("x-auth-token")?.value ?? nanoid()

	/*
        - "existing" -> token already in room, pass through
        - "{value}" -> token added to room, set cookie
        - "error:{code}" -> redirect with this error
    */
	const JOIN_ROOM_SCRIPT = `
        local connected = redis.call('HGET', KEYS[1], 'connected')
        if not connected then
            return 'error:invalid-room'
        end
        connected = cjson.decode(connected) or {}

        local authToken = ARGV[1]
        for _, token in ipairs(connected) do
            if token == authToken then 
                return "existing:" .. authToken
            end
        end

        if #connected >= tonumber(ARGV[2]) then
            return 'error:room-full'
        end

        table.insert(connected, authToken)
        redis.call('HSET', KEYS[1], 'connected', cjson.encode(connected))
        return "connected:" .. authToken
    `

	const ROOM_CAP = 2
	const res = (await redis.eval(JOIN_ROOM_SCRIPT, [roomKey], [authToken, ROOM_CAP])) as string
	if (res.startsWith("error:")) {
		const idx = res.indexOf(":")
		const error = res.slice(idx + 1)

		return NextResponse.redirect(new URL(`/?error=${error}`, req.url))
	}

	if (res.startsWith("existing:")) {
		return NextResponse.next()
	}

	const response = NextResponse.next()

	response.cookies.set("x-auth-token", authToken, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		httpOnly: true,
	})

	return response
}

export const config = {
	matcher: "/room/:path*",
}
