import { z } from "zod"

export const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
	UPSTASH_REDIS_REST_URL: z.url(),
	UPSTASH_REDIS_REST_TOKEN: z.string(),
})

export const env = envSchema.parse(process.env)
