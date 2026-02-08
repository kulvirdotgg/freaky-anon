import { Elysia } from "elysia"
import { z } from "zod"

import { redis, redisKey } from "@/lib/redis"

export const room = new Elysia({ name: "room" }).macro("room", {
	params: z.object({
		roomId: z.nanoid(),
	}),
	resolve: async ({ params: { roomId }, status }) => {
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

		return {
			room: {
				id: roomId,
				connected,
				ttl,
			},
		}
	},
})
