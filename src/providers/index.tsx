"use client"

import { QueryProvider } from "@/providers/query"
import { Realtime } from "@/providers/realtime"

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<Realtime>
			<QueryProvider>{children}</QueryProvider>
		</Realtime>
	)
}
