import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-sans",
})

// biome-ignore lint: Next.js metadata export
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
		<html className={`${jetbrainsMono.variable} dark`} lang="en">
			<body className="antialiased">{children}</body>
		</html>
	)
}
