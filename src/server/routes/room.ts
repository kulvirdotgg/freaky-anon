import { Elysia } from "elysia"
import { nanoid } from "nanoid"
import { z } from "zod"

import { type Message, realtime } from "@/lib/realtime"
import { redis, redisKey } from "@/lib/redis"
import { roomAuth } from "@/server/middleware/auth"

const ROOM_DURATION = 10 * 60 // 10 mins

export const roomRouter = new Elysia({ prefix: "/room" })
	.use(roomAuth)
	.post("/", async ({ status }) => {
		const roomId = nanoid()

		const roomKey = redisKey("room", roomId)
		await redis
			.pipeline()
			.hset(roomKey, {
				connected: [],
				createdAt: Date.now(),
			})
			.expire(roomKey, ROOM_DURATION)
			.exec()

		return status(201, {
			roomId,
		})
	})
	.post(
		"/:roomId/message",
		async ({ authToken, body, room }) => {
			const message: Message = {
				id: nanoid(),
				sender: body.sender,
				content: body.content,
				timestamp: Date.now(),
				roomId: room.id,
			}

			const messageKey = redisKey("message", room.id)
			await redis
				.pipeline()
				.rpush(messageKey, { ...message, authToken })
				.expire(messageKey, room.ttl)
				.exec()

			await realtime.channel(room.id).emit("room.message", message)

			// expire redis stream used by realtime package
			await redis.expire(room.id, room.ttl)
		},
		{
			body: z.object({
				content: z.string().min(1).max(1000),
				sender: z.string().min(1).max(50),
			}),
			"room-auth": true,
		},
	)
