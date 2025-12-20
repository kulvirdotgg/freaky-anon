import { Elysia, t } from "elysia"
import { nanoid } from "nanoid"

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
			body: t.Object({
				ttl: t.Number({ minimum: 120, maximum: 600 }),
			}),
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			const { id } = params
			const redisRoomKey = `room:${id}`

			const room = await redis.hgetall(redisRoomKey)

			return { room }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
