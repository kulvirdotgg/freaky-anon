import { Redis } from "@upstash/redis"

export const redis = Redis.fromEnv()

const RedisKeys = {
	room: (roomId: string) => `room:${roomId}`,
} as const

type KeyType = keyof typeof RedisKeys

export function genRedisKey(type: KeyType, roomId: string): string {
	const keyFunc = RedisKeys[type]
	return keyFunc(roomId)
}
