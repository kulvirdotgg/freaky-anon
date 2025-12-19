import { Elysia } from "elysia"
import { roomRouter } from "./room"

const app = new Elysia({ prefix: "/api" })
	.get("/health", () => {
		return {
			success: true,
			message: "uWu onii chan!!",
		}
	})
	.use(roomRouter)

export { app }

export type App = typeof app
