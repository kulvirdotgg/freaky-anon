import { AsyncLocalStorage } from "node:async_hooks"
import { randomUUID } from "node:crypto"

import { Elysia } from "elysia"

const storage = new AsyncLocalStorage<string>()

const CORRELTION_HEADER = "x-correlation-id"

export const correlator = new Elysia({ name: "correlator" })
	.onRequest(({ request, set }) => {
		const id = request.headers.get(CORRELTION_HEADER) ?? randomUUID()
		set.headers[CORRELTION_HEADER] = id
		storage.enterWith(id)
	})
	.as("scoped")

export const getCorrelationId = () => storage.getStore()
