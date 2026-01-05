import { Elysia } from "elysia"
import { nanoid } from "nanoid"
import { z } from "zod"

import { genRedisKey, redis } from "@/server/utils/redis"

export const roomRouter = new Elysia({ prefix: "/room" })
	.post(
		"/",
		async ({ body, status }) => {
			const roomId = nanoid()

			const roomKey = genRedisKey("room", roomId)
			await redis.hset(roomKey, {
				connected: [],
				createdAt: Date.now(),
			})
			await redis.expire(roomKey, body.ttl)

			return status(201, {
				roomId,
			})
		},
		{
			body: z.object({
				ttl: z.number().min(120).max(600).default(600),
			}),
		},
	)
	.get(
		"/:roomId",
		async ({ params: { roomId } }) => {
			const redisRoomKey = `room:${roomId}`

			const room = await redis.hgetall(redisRoomKey)

			return { room }
		},
		{
			params: z.object({
				roomId: z.string(),
			}),
		},
	)
