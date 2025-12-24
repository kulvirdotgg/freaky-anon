import { Elysia } from "elysia"

import { roomRouter } from "@/server/routes/room"

const app = new Elysia({ prefix: "/api" })
	.onError(({ code, error, status }) => {
		if (process.env.NODE_ENV !== "production") {
			console.error(error)
		}

		switch (code) {
			case "VALIDATION": {
				const valueError = error.valueError

				return {
					status: 422,
					code: error.code,
					details: {
						path: error.type,
						location: valueError?.path.startsWith("/") ? valueError.path.slice(1) : valueError?.path,
						message: valueError?.message,
						rejected_value: valueError?.value,
					},
				}
			}
			case "NOT_FOUND": {
				return {
					status: 404,
					message: "Route not found",
				}
			}
			case "UNKNOWN":
			case "INTERNAL_SERVER_ERROR": {
				let errMsg = "An internal server error has occurred"
				if (error.message) {
					errMsg = error.message
				}

				return status(500, {
					status: 500,
					message: errMsg,
				})
			}
		}
	})
	.get("/health", ({ status }) => {
		return status(200, { message: "uWu oniiiChan!!!!!" })
	})
	.use(roomRouter)

export { app }

export type App = typeof app
