import { Elysia } from "elysia"

import { logger } from "@/server/utils/logger"

export const requestLogger = new Elysia({ name: "request-logger" })
	.derive(() => {
		const startTime = performance.now()
		return { startTime }
	})
	.onBeforeHandle(({ request: { method, url, headers }, body }) => {
		logger.info(
			{
				request: {
					method,
					url,
					body,
					headers: Object.fromEntries(headers.entries()),
				},
			},
			"incoming request",
		)
	})
	.onAfterHandle(({ set, responseValue, startTime }) => {
		const duration = `${(performance.now() - startTime).toFixed(2)}ms`

		logger.info(
			{
				response: responseValue,
				headers: set.headers,
				duration,
			},
			"request completed",
		)
	})
	.onError(({ error, code, startTime }) => {
		const duration = startTime ? `${(performance.now() - startTime).toFixed(2)}ms` : undefined

		logger.error(
			{
				error: {
					type: code,
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				},
				duration,
			},
			"request failed",
		)
	})
	.as("global")
