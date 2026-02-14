"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, ViewTransition } from "react"

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
	const messagesRef = useRef<HTMLDivElement>(null)

	const { name } = useUsername()

	const { data: roomData } = useQuery({
		queryKey: ["room", roomId],
		queryFn: async () => {
			const res = await client.room({ roomId }).get()
			return res.data
		},
	})

	const inputRef = useRef<HTMLInputElement>(null)
	const { isPending, mutate: sendMessage } = useMutation({
		mutationKey: ["send-message"],
		mutationFn: async ({ content }: { content: string }) => {
			await client.room({ roomId: params.roomId as string }).message.post({
				sender: name,
				content,
			})
		},
	})

	const router = useRouter()

	const queryClient = useQueryClient()
	useRealtime({
		channels: [roomId],
		events: ["room.message", "room.destroy"],
		onData: ({ event, data: msg }) => {
			if (event === "room.message") {
				queryClient.setQueryData(["room", roomId], (old: typeof roomData) => {
					if (!old) return { messages: [msg], ttl: 0 }
					return { ...old, messages: [...old.messages, msg] }
				})
			} else if (event === "room.destroy") {
				router.push("/?destroyed=true")
			}
		},
	})

	// biome-ignore lint/correctness/useExhaustiveDependencies: the linter just sucks, I need dependecy here
	useEffect(() => {
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight
		}
	}, [roomData?.messages])

	return (
		<>
			<div
				className="[&::-webkit-scrollbar-thumb]:bg-primary/70 [&::-webkit-scrollbar-track]:bg-muted flex-1 space-y-4 overflow-auto p-4 [&::-webkit-scrollbar]:w-2"
				ref={messagesRef}
			>
				{roomData?.messages?.length === 0 && (
					<div className="text-muted-foreground flex h-full items-center justify-center">
						No messages!! Start the conversation
					</div>
				)}

				{roomData?.messages?.map((msg) => {
					return (
						<ViewTransition key={msg.id}>
							<div className="mb-1 flex items-baseline gap-3">
								<span
									className={cn(
										"text-xs font-bold uppercase",
										msg.sender === name ? "text-primary" : "text-blue-500",
									)}
								>
									{msg.sender === name ? "Me" : msg.sender}
								</span>
								<span className="text-muted-foreground text-[10px]">
									{formatTimestamp(msg.timestamp)}
								</span>
							</div>
							<p className="text-sm leading-relaxed">{msg.content}</p>
						</ViewTransition>
					)
				})}
			</div>

			<div className="bg-background/30 border-t p-4">
				<div className="flex gap-4">
					<div className="group relative flex-1">
						<span className="text-accent absolute top-1/2 left-4 -translate-y-1/2 font-bold">{">"}</span>
						<Input
							// oxlint-disable no-autofocus
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
