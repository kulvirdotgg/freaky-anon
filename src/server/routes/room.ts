import { Elysia } from "elysia"
import { nanoid } from "nanoid"
import { z } from "zod"

import { type Message, realtime } from "@/lib/realtime"
import { redis, redisKey } from "@/lib/redis"
import { roomAuth } from "@/server/middleware/auth"

export const roomRouter = new Elysia({ prefix: "/room" })
	.use(roomAuth)
	.post(
		"/",
		async ({ body, status }) => {
			const roomId = nanoid()

			const roomKey = redisKey("room", roomId)
			const pipeline = redis
				.pipeline()
				.hset(roomKey, {
					connected: [],
					createdAt: Date.now(),
				})
				.expire(roomKey, body.ttl)
			await pipeline.exec()

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
	.post(
		"/:roomId/message",
		async ({ authToken, body, room }) => {
			const message: Message = {
				id: nanoid(),
				sender: body.sender,
				text: body.text,
				timestamp: Date.now(),
				roomId: room.id,
			}

			const messageKey = redisKey("message", room.id)
			const pipeline = redis
				.pipeline()
				.rpush(messageKey, { ...message, authToken })
				.expire(messageKey, room.ttl)

			await pipeline.exec()

			await realtime.channel(room.id).emit("room.message", message)

			// expire redis stream used by realtime package
			await redis.expire(room.id, room.ttl)
		},
		{
			body: z.object({
				text: z.string().min(1).max(1000),
				sender: z.string().min(1).max(50),
			}),
			"room-auth": true,
		},
	)
