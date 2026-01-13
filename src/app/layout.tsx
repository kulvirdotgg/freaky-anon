import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"

import { cn } from "@/lib/utils"
import { Providers } from "@/providers"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-sans",
})

export const metadata: Metadata = {
	description: "Freaky self destructible chats with anons.",
	title: "freaky-anon",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html className={cn(jetbrainsMono.variable, "dark")} lang="en">
			<body className="antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
