"use client"

import { useMutation } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/api-client"

export default function Page() {
	const params = useParams()

	const [message, setMessage] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	const { name } = useUsername()

	const { isPending, mutate: sendMessage } = useMutation({
		mutationKey: ["send-message"],
		mutationFn: async ({ content }: { content: string }) => {
			await client.room({ roomId: params.roomId as string }).message.post({
				sender: name,
				content,
			})
		},
	})

	return (
		<>
			<div className="flex-1 space-y-4 overflow-y-auto p-4">
				<div className="flex h-full items-center justify-center text-muted-foreground">
					No messages!! Start the conversation
				</div>
			</div>

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
									sendMessage({ content: message })
									setMessage("")
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
						disabled={isPending || !message.trim()}
						onClick={() => {
							sendMessage({ content: message })
							setMessage("")
							inputRef.current?.focus()
						}}
						variant="secondary"
					>
						Send
					</Button>
				</div>
			</div>
		</>
	)
}
