"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRealtime } from "@/hooks/use-realtime"
import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/api-client"
import { formatTimestamp } from "@/lib/format-time"
import { cn } from "@/lib/utils"

export default function Page() {
	const params = useParams()
	const roomId = params.roomId as string

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

	const { data: messages } = useQuery({
		queryKey: ["messages", roomId],
		queryFn: async () => {
			const res = await client.room({ roomId }).get()

			return res.data?.messages
		},
	})

	const queryClient = useQueryClient()
	useRealtime({
		channels: [roomId],
		events: ["room.message", "room.destroy"],
		onData: ({ event, data }) => {
			if (event === "room.message") {
				queryClient.setQueryData(["messages", roomId], (old: typeof messages) => {
					if (!old) return [data]
					return [...old, data]
				})
			}
		},
	})

	return (
		<>
			<div className="flex-1 space-y-4 overflow-y-auto p-4">
				{messages?.length === 0 && (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						No messages!! Start the conversation
					</div>
				)}

				{messages?.map((msg) => {
					return (
						<div className="flex flex-col items-start" key={msg.id}>
							<div className="group max-w-4/5">
								<div className="mb-1 flex items-baseline gap-3">
									<span
										className={cn(
											"font-bold text-xs uppercase",
											msg.sender === name ? "text-blue-500" : "text-primary",
										)}
									>
										{msg.sender === name ? "Me" : msg.sender}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{formatTimestamp(msg.timestamp)}
									</span>
								</div>
								<p className="break-all text-sm leading-relaxed">{msg.content}</p>
							</div>
						</div>
					)
				})}
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
