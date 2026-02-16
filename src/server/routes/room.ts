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
  return {-1, 0}
end

local connectedRaw = redis.call("HGET", KEYS[1], "connected")
local connected = cjson.decode(connectedRaw)

-- if room capacity if full
if #connected >= tonumber(ARGV[1]) then
  return {0, 0}
end

-- append the user to the room's connected list
table.insert(connected, ARGV[2])
redis.call("HSET", KEYS[1], "connected", cjson.encode(connected))
local ttl = redis.call("TTL", KEYS[1])
return {1, ttl}
`

export const roomRouter = new Elysia({ prefix: "/room" })
	.use(room)
	.post("/", async ({ cookie, status }) => {
		const roomId = nanoid()
		const roomKey = redisKey("room", roomId)

		const userId = nanoid()
		await redis
			.pipeline()
			.hset(roomKey, {
				connected: [userId],
				createdAt: Date.now(),
			})
			.expire(roomKey, ROOM_DURATION_SECONDS)
			.exec()

		cookie["x-user-id"]?.set({
			value: userId,
			path: "/",
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			httpOnly: true,
			expires: new Date(Date.now() + ROOM_DURATION_SECONDS * 1000), // room duration in ms
		})

		return status(201, { roomId })
	})
	.post(
		"/:roomId/join",
		async ({ params, cookie, status }) => {
			const { roomId } = params

			const roomKey = redisKey("room", roomId)
			const userId = nanoid()

			const [code, ttl] = await redis.eval<[string, string], [number, number]>(
				JOIN_ROOM_SCRIPT,
				[roomKey],
				[ROOM_CAP.toString(), userId],
			)

			switch (code) {
				case -1:
					return status(410, { message: "Room expired" })
				case 0:
					return status(403, { message: "Room full" })
			}

			cookie["x-user-id"]?.set({
				value: userId,
				path: "/",
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				httpOnly: true,
				expires: new Date(Date.now() + ttl * 1000), // room ttl in ms
			})

			return status(200, { roomId })
		},
		{
			params: z.object({
				roomId: z.nanoid(),
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
		async ({ cookie, body, room }) => {
			const userId = cookie["x-user-id"]?.value as string

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
				.rpush(messageKey, { ...message, userId })
				.expire(messageKey, room.ttl)
				.exec()

			// emit the new message notification to the redis stream
			// and notify all the subscribers about the new message
			await realtime.channel(room.id).emit("room.message", message)

			// expire redis stream used by realtime package
			await redis.expire(room.id, room.ttl)
		},
		{
			body: z.object({
				content: z.string().min(1).max(1000),
				sender: z.string().min(1).max(50),
			}),
			room: true,
		},
	)
