import { Elysia } from "elysia"
import { z } from "zod"

import { redis, redisKey } from "@/lib/redis"

export const room = new Elysia({ name: "room" }).macro("room", {
	params: z.object({
		roomId: z.nanoid(),
	}),
	cookie: z.object({
		"x-user-id": z.nanoid(),
	}),
	resolve: async ({ params, cookie, status }) => {
		const roomId = (params as { roomId: string }).roomId
		const roomKey = redisKey("room", roomId)
		const [connected, ttl] = await redis.pipeline().hget<string[]>(roomKey, "connected").ttl(roomKey).exec()

		if (!connected) {
			return status(404, {
				message: "Room not found",
			})
		}

		if (ttl === -2 || ttl === -1) {
			return status(410, {
				message: "Room expired",
			})
		}

		const userId = cookie["x-user-id"].value
		if (!connected.includes(userId)) {
			return status(403, {
				message: "User not authorized for the room",
			})
		}

		return {
			room: {
				id: roomId,
				connected,
				ttl,
			},
		}
	},
})
