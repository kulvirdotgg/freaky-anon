import { Elysia } from "elysia"
import { nanoid } from "nanoid"
import { z } from "zod"

import { type Message, realtime } from "@/lib/realtime"
import { redis, redisKey } from "@/lib/redis"
import { room } from "@/server/middleware/room"

const ROOM_CAP = 2
const ROOM_DURATION_SECONDS = 10 * 60 // 10 mins

const JOIN_ROOM_SCRIPT = `
if redis.call("EXISTS", KEYS[1]) == 0 then
  return -1
end

local connectedRaw = redis.call("HGET", KEYS[1], "connected")
local connected = cjson.decode(connectedRaw)

-- if room capacity if full
if #connected >= tonumber(ARGV[1]) then
  return 0
end

-- append the user to the room's connected list
table.insert(connected, ARGV[2])
redis.call("HSET", KEYS[1], "connected", cjson.encode(connected))
local ttl = redis.call("TTL", KEYS[1])
return ttl
`

export const roomRouter = new Elysia({ prefix: "/room" })
	.use(room)
	.post(
		"/",
		async ({ cookie, body, status }) => {
			const userId = nanoid()
			let { roomId } = body
			let ttl = ROOM_DURATION_SECONDS

			if (roomId) {
				const roomKey = redisKey("room", roomId)
				const result = await redis.eval<[string, string], number>(
					JOIN_ROOM_SCRIPT,
					[roomKey],
					[ROOM_CAP.toString(), userId],
				)

				switch (result) {
					case -1:
						return status(404, { message: "Room not found" })
					case 0:
						return status(403, { message: "Room full" })
					default:
						ttl = result
				}
			} else {
				roomId = nanoid()
				const roomKey = redisKey("room", roomId)
				await redis
					.pipeline()
					.hset(roomKey, {
						connected: [userId],
						createdAt: Date.now(),
					})
					.expire(roomKey, ROOM_DURATION_SECONDS)
					.exec()
			}

			cookie["x-user-id"]?.set({
				value: userId,
				path: "/",
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				httpOnly: true,
				expires: new Date(Date.now() + ttl * 1000),
			})

			return status(201, { roomId })
		},
		{
			body: z.object({
				roomId: z.nanoid().optional(),
			}),
		},
	)
	.get(
		"/:roomId",
		async ({ room, status }) => {
			const messagesKey = redisKey("message", room.id)
			const messages = await redis.lrange<Message>(messagesKey, 0, -1)

			return status(200, {
				messages: messages.map((msg) => ({
					...msg,
					userId: undefined,
				})),
				ttl: room.ttl,
			})
		},
		{
			room: true,
		},
	)
	.delete(
		"/:roomId",
		async ({ room }) => {
			// send destryoed signal to realtime channel
			await realtime.channel(room.id).emit("room.destroy", { isDestroyed: true })

			// delete the following entries from redis
			// room - room metadata
			// room messages - room history
			// room stream - that was used for realtime pub sub msgs
			const roomKey = redisKey("room", room.id)
			const messagesKey = redisKey("message", room.id)
			await redis.pipeline().del(roomKey).del(messagesKey).del(room.id).exec()
		},
		{
			room: true,
		},
	)
	.post(
		"/:roomId/message",
		async ({ cookie, body, room, status }) => {
			const userId = cookie["x-user-id"]?.value as string

			const message: Message = {
				id: nanoid(),
				clientMessageId: body.clientMessageId,
				sender: body.sender,
				content: body.content,
				timestamp: Date.now(),
				roomId: room.id,
			}

			const messageKey = redisKey("message", room.id)
			await redis
				.pipeline()
				.rpush(messageKey, { ...message, userId })
				.expire(messageKey, room.ttl)
				.exec()

			// emit the new message notification to the redis stream
			// and notify all the subscribers about the new message
			await realtime.channel(room.id).emit("room.message", message)

			// expire redis stream used by realtime package
			await redis.expire(room.id, room.ttl)

			return status(201, message)
		},
		{
			body: z.object({
				content: z.string().min(1).max(1000),
				sender: z.string().min(1).max(50),
				clientMessageId: z.nanoid(),
			}),
			room: true,
		},
	)
