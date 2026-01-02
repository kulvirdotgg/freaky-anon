"use client"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Page() {
	const [message, setMessage] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<>
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
		</>
	)
}
