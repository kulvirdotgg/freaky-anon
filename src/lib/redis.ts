import { Redis } from "@upstash/redis"

export const redis = Redis.fromEnv()

const RedisKeys = {
	room: "room",
	message: "message",
} as const

type KeyType = keyof typeof RedisKeys

export function redisKey(key: KeyType, id: string): string {
	return `${key}:${id}`
}
