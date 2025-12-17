"use client"

import { QueryProvider } from "@/providers/query"

export function Providers({ children }: { children: React.ReactNode }) {
	return <QueryProvider>{children}</QueryProvider>
}
