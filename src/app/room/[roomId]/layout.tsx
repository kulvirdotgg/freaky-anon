"use client"

import clsx from "clsx"
import { Copy, CopyCheck } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/format-time"

export default function RoomLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const { roomId } = useParams()

	const [isCopied, setIsCopied] = useState(false)
	const [secondsLeft, setSecondsLeft] = useState(100)

	const copyLink = () => {
		const url = window.location.href
		window.navigator.clipboard.writeText(url)

		setIsCopied(true)
		setTimeout(() => setIsCopied(false), 2 * 1000)
	}

	useEffect(() => {
		const timer = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					clearInterval(timer)
					return 0
				}
				return prev - 1
			})
		}, 1000)
		return () => clearInterval(timer)
	}, [])

	return (
		<main className="flex h-screen flex-col">
			<header className="flex items-center justify-between border-b bg-background/30 p-4">
				<div className="flex items-center gap-4">
					<div className="flex flex-col">
						<span className="text-xs uppercase">Room ID</span>
						<div className="flex items-center gap-2">
							<code className="font-bold text-accent text-sm">{roomId}</code>
							<Button
								className="cursor-pointer"
								disabled={isCopied}
								onClick={copyLink}
								size="icon"
								variant="ghost"
							>
								{isCopied ? <CopyCheck /> : <Copy />}
							</Button>
						</div>
					</div>
					<div className="h-8 w-px bg-secondary" />
					<div className="flex flex-col">
						<span className="text-xs uppercase">Self Destruct</span>
						<span className={clsx("text-amber-500", secondsLeft <= 60 && "text-rose-500")}>
							{formatTime(secondsLeft)}
						</span>
					</div>
				</div>
				<Button className="font-bold uppercase" variant="destructive">
					insta destroy
				</Button>
			</header>
			{children}
		</main>
	)
}
