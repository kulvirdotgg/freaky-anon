import { Elysia } from "elysia"
import { nanoid } from "nanoid"
import { z } from "zod"

import { redis } from "@/server/utils/redis"

export const roomRouter = new Elysia({ prefix: "/room" })
	.post(
		"/",
		async ({ body, status }) => {
			const roomId = nanoid()

			const redisRoomKey = `room:${roomId}`
			await redis.hset(redisRoomKey, {
				connected: [],
				createdAt: Date.now(),
			})
			// If user does not provider `ttl` value
			// use default value of 10 mins
			await redis.expire(redisRoomKey, body.ttl)

			return status(201, {
				roomId,
			})
		},
		{
			body: z.object({
				ttl: z.number().min(120).max(600),
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
