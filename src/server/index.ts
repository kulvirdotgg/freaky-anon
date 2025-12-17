import { Elysia } from "elysia"

const app = new Elysia({ prefix: "/api" }).get("/health", () => {
	return {
		success: true,
		message: "uWu onii chan!!",
	}
})

export { app }
