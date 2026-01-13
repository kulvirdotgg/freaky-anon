import { Elysia } from "elysia"

import { errorHandler } from "@/server/middleware/error-handler"
import { requestLogger } from "@/server/middleware/request-logger"
import { roomRouter } from "@/server/routes/room"

const app = new Elysia({ prefix: "/api" })
	.use(requestLogger)
	.use(errorHandler)
	.get("/health", async ({ status }) => {
		return status(200, { message: "uWu oniiiChan!!!!!" })
	})
	.use(roomRouter)

export { app }

export type App = typeof app
