import { Elysia } from "elysia"

import { env } from "@/server/utils/env"

export const errorHandler = new Elysia({ name: "error-handler" })
	.onError(({ code, error, status }) => {
		if (env.NODE_ENV !== "production") {
			console.error(error)
		}

		switch (code) {
			case "VALIDATION": {
				return status(422, {
					status: 422,
					message: error.valueError?.message,
					details: {
						location: error.type,
						rejected_value: error.value,
						expected: error.expected,
					},
				})
			}
			case "NOT_FOUND": {
				return status(404, {
					status: 404,
					message: "Route not found",
				})
			}
			default: {
				const statusCode = "status" in error ? (error.status as number) : 500

				let errMsg = "An error occurred"
				if (error instanceof Error && error.message) {
					errMsg = error.message
				}

				return status(statusCode, {
					status: statusCode,
					message: errMsg,
				})
			}
		}
	})
	.as("scoped")
