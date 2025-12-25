import pino from "pino"

import { getCorrelationId } from "@/server/middleware/correlation-id"

import { env } from "@/server/utils/env"

interface LoggerOptions {
	level?: string
}

class Logger {
	private logger: pino.Logger

	constructor(options: LoggerOptions = {}) {
		const { level = "info" } = options

		const isProd = env.NODE_ENV === "production"

		this.logger = pino({
			level,
			// log any string message as "message" key
			messageKey: "message",
			// for **NOT PROD** environments, use pretty logging
			transport: !isProd
				? {
						target: "pino-pretty",
						options: { singleLine: true },
					}
				: undefined,
			base: undefined,
			// log **correlation-id** with every statement
			mixin() {
				const correlationId = getCorrelationId()
				return correlationId ? { correlationId } : {}
			},
		})
	}

	get(): pino.Logger {
		return this.logger
	}
}

export const logger = new Logger().get()
