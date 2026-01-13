import { Elysia } from "elysia"
import { z } from "zod"

import { genRedisKey, redis } from "@/server/utils/redis"

export const roomAuth = new Elysia({ name: "room-auth" }).macro("room-auth", {
	params: z.object({
		roomId: z.nanoid(),
	}),
	cookie: z.object({
		"x-auth-token": z.nanoid(),
	}),
	resolve: async ({ params: { roomId }, cookie, status }) => {
		const authToken = cookie["x-auth-token"].value

		const roomKey = redisKey("room", roomId)
		const [connected, ttl] = await redis.pipeline().hget<string[]>(roomKey, "connected").ttl(roomKey).exec()
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
				ttl,
			},
			authToken,
		}
	},
})
