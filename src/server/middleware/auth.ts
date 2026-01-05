import { Elysia } from "elysia"
import { z } from "zod"

import { genRedisKey, redis } from "@/server/utils/redis"

export const roomAuth = new Elysia({ name: "room-auth" })
	.guard({
		params: z.object({
			roomId: z.nanoid(),
		}),
		cookie: z.object({
			"x-auth-token": z.nanoid(),
		}),
	})
	.derive(async ({ cookie, params: { roomId }, status }) => {
		const authToken = cookie["x-auth-token"].value

		const roomKey = genRedisKey("room", roomId)
		const connected = await redis.hget<string[]>(roomKey, "connected")
		if (!connected?.includes(authToken)) {
			return status(401, {
				status: 401,
				message: "Not authenticated to join the room",
			})
		}

		return {
			room: {
				id: roomId,
				connected,
			},
			authToken,
		}
	})
	.as("scoped")
