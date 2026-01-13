import { type InferRealtimeEvents, Realtime } from "@upstash/realtime"
import z from "zod/v4"

import { redis } from "@/lib/redis"

export const messageSchema = z.object({
	id: z.nanoid(),
	sender: z.string(),
	text: z.string(),
	timestamp: z.number(),
	roomId: z.nanoid(),
	authToken: z.nanoid().optional(),
})

export type Message = z.infer<typeof messageSchema>

const schema = {
	room: {
		message: messageSchema,
		destory: z.object({
			isDestoyed: z.literal(true),
		}),
	},
}

export const realtime = new Realtime({ schema, redis })
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>
