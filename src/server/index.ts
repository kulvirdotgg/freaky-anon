import { handle } from "@upstash/realtime"
import { Elysia } from "elysia"

import { realtime } from "@/lib/realtime"
import { errorHandler } from "@/server/middleware/error-handler"
import { roomRouter } from "@/server/routes/room"

const app = new Elysia({ prefix: "/api" })
	.use(errorHandler)
	.get("/realtime", () => handle({ realtime }))
	.get("/health", async ({ status }) => {
		return status(200, { message: "uWu oniiiChan!!!!!" })
	})
	.use(roomRouter)

export { app }

export type App = typeof app
