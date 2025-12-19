import { Elysia, t } from "elysia"
import { nanoid } from "nanoid"

import { redis } from "@/lib/redis"

export const roomRouter = new Elysia({ prefix: "/room" }).post(
	"/",
	async ({ body }) => {
		const roomId = nanoid()

		const redisRoomKey = `room:${roomId}`
		await redis.hset(redisRoomKey, {
			connected: [],
			createdAt: Date.now(),
		})
		await redis.expire(redisRoomKey, body.ttl)

		return {
			message: "created a room",
			roomId,
		}
	},
	{
		body: t.Object({
			ttl: t.Number({ minimum: 120, maximum: 600, default: 600 }),
		}),
	},
)
