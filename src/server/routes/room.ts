import { Elysia } from "elysia"
import { nanoid } from "nanoid"
import { z } from "zod"

import { type Message, realtime } from "@/lib/realtime"
import { redis, redisKey } from "@/lib/redis"
import { roomAuth } from "@/server/middleware/auth"

const ROOM_CAP = 2
const ROOM_DURATION_SECONDS = 10 * 60 // 10 mins

export const roomRouter = new Elysia({ prefix: "/room" })
	.use(roomAuth)
	.post(
		"/",
		async ({ body, cookie, status }) => {
			let roomId = body.roomId

			const authToken = cookie["x-auth-token"]?.value ?? nanoid()

			if (roomId) {
				const roomKey = redisKey("room", roomId)
				const connected = await redis.hget<string[]>(roomKey, "connected")

				if (!connected) {
					return status(404, {
						status: 404,
						message: "Room not found",
					})
				}

				if (connected.includes(authToken)) {
					return status(201, { roomId })
				}

				if (connected.length >= ROOM_CAP) {
					return status(403, {
						status: 403,
						message: "Room full",
					})
				}

				await redis.hset(roomKey, { connected: [...connected, authToken] })
			} else {
				roomId = nanoid()
				const roomKey = redisKey("room", roomId)
				await redis
					.pipeline()
					.hset(roomKey, {
						connected: [authToken],
						createdAt: Date.now(),
					})
					.expire(roomKey, ROOM_DURATION_SECONDS)
					.exec()
			}

			const authCookie = cookie["x-auth-token"]
			if (authCookie) {
				authCookie.set({
					value: authToken,
					path: "/",
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					httpOnly: true,
					expires: new Date(Date.now() + ROOM_DURATION_SECONDS * 1000), // room duration in ms
				})
			}

			return status(201, { roomId })
		},
		{
			body: z.object({
				roomId: z.nanoid().optional(),
			}),
			cookie: z.object({
				"x-auth-token": z.nanoid().optional(),
			}),
		},
	)
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
