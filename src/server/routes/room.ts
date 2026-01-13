import { Elysia } from "elysia"
import { nanoid } from "nanoid"
import { z } from "zod"

import { roomAuth } from "@/server/middleware/auth"
import { genRedisKey, redis } from "@/server/utils/redis"

export const roomRouter = new Elysia({ prefix: "/room" })
	.use(roomAuth)
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
			redis.rpush(messageKey, { ...message, authToken })

			await realtime.channel(room.id).emit("room.message", message)

			// messages should also expire along with the room
			// set the message expiry same as room expiry
			redis.expire(messageKey, room.ttl)

			// expire redis stream used by realtime package
			redis.expire(room.id, room.ttl)
		},
		{
			body: z.object({
				message: z.string().min(1).max(1000),
				sender: z.string().min(1).max(50),
			}),
			"room-auth": true,
		},
	)
