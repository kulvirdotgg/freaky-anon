"use client"

import clsx from "clsx"
import { Copy, CopyCheck } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/format-time"
import { Input } from "@/components/ui/input"

export default function Page() {
	const { roomId } = useParams()

	const [isCopied, setIsCopied] = useState(false)
	const [secondsLeft, setSecondsLeft] = useState(100)

	const [message, setMessage] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	const copyLink = () => {
		const url = window.location.href
		window.navigator.clipboard.writeText(url)

		setIsCopied(true)
		setTimeout(() => setIsCopied(false), 2 * 1000) // 2 seconds
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

			<div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4"></div>

			<div className="border-t bg-background/30 p-4">
				<div className="flex gap-4">
					<div className="group relative flex-1">
						<span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-accent">{">"}</span>
						<Input
							autoFocus
							className="w-full py-3 pl-8 text-sm"
							onChange={(e) => setMessage(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && message.trim()) {
									console.log(message)
									// TODO: send the message
									inputRef.current?.focus()
								}
							}}
							placeholder="Type message..."
							ref={inputRef}
							type="text"
							value={message}
						/>
					</div>
					<Button
						className="font-bold uppercase disabled:cursor-not-allowed"
						onClick={() => console.log("clicked")}
						variant="secondary"
					>
						Send
					</Button>
				</div>
			</div>
		</main>
	)
}
