"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { nanoid } from "nanoid"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, ViewTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRealtime } from "@/hooks/use-realtime"
import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/api-client"
import { formatTimestamp } from "@/lib/format-time"
import type { Message } from "@/lib/realtime"
import { cn } from "@/lib/utils"

type MessageStatus = "sending" | "failed"

type ChatMessage = Message & { status?: MessageStatus }

type RoomData = {
	messages: ChatMessage[]
	ttl: number
}

function addMessage(room: RoomData, message: Message): RoomData {
	const messages = [...room.messages]
	const msgIdx = messages.findIndex((msg) => msg.clientMessageId === message.clientMessageId)

	if (msgIdx >= 0) {
		const existingMessage = messages[msgIdx]!
		const { status: _status, ...messageWithoutStatus } = existingMessage

		messages[msgIdx] = {
			...messageWithoutStatus,
			...message,
		}
	} else {
		messages.push(message)
	}

	return {
		ttl: room.ttl,
		messages,
	}
}

export default function Page() {
	const params = useParams()
	const roomId = params.roomId as string

	const [message, setMessage] = useState("")
	const messagesRef = useRef<HTMLDivElement>(null)

	const { name } = useUsername()

	const router = useRouter()
	const queryClient = useQueryClient()

	// query key for tanstack query
	const ROOM_QUERY_KEY = ["room", roomId] as const

	const { data: roomData } = useQuery<RoomData>({
		queryKey: ROOM_QUERY_KEY,
		queryFn: async () => {
			const res = await client.room({ roomId }).get()
			if (res.status !== 200) {
				const error = "not allowed to join the room"
				router.push(`/?room-id=${roomId}&error=${error}`)
			}
			return res.data as RoomData
		},
	})

	const inputRef = useRef<HTMLInputElement>(null)
	const { mutate: sendMessage } = useMutation({
		mutationKey: ["send-message"],
		mutationFn: async ({ content, clientMessageId }: { content: string; clientMessageId: string }) => {
			const res = await client.room({ roomId }).message.post({
				sender: name,
				content,
				clientMessageId,
			})

			if (res.status !== 201) {
				throw new Error("Unable to send the message")
			}

			return res.data as Message
		},
		onMutate: async ({ content, clientMessageId }) => {
			await queryClient.cancelQueries({ queryKey: ROOM_QUERY_KEY })

			const optimisticMessage: ChatMessage = {
				id: `temp-${clientMessageId}`,
				clientMessageId,
				sender: name,
				content,
				timestamp: Date.now(),
				roomId,
				status: "sending",
			}

			queryClient.setQueryData<RoomData>(ROOM_QUERY_KEY, (room) => {
				// NOTE: if user reached here
				// room will always be valid and never undefined
				return {
					ttl: room!.ttl,
					messages: [...room!.messages, optimisticMessage],
				}
			})
			return { clientMessageId }
		},
		onSuccess: (sentMessage) => {
			queryClient.setQueryData<RoomData>(ROOM_QUERY_KEY, (room) => {
				return addMessage(room!, sentMessage)
			})
		},
		onError: (_error, _input, context) => {
			if (!context?.clientMessageId) return
			queryClient.setQueryData<RoomData>(ROOM_QUERY_KEY, (room) => {
				return {
					...room!,
					messages: room!.messages.map((msg) =>
						msg.clientMessageId === context.clientMessageId ? { ...msg, status: "failed" } : msg,
					),
				}
			})
		},
	})

	const submitMessage = (content: string, clientMessageId = nanoid()) => {
		// send message using tanstack mutation
		sendMessage({ content, clientMessageId })
		// clear the input field after message is sent
		setMessage("")
		// put back focus on the input field
		// so user can start typing new msg instantly
		inputRef.current?.focus()
	}

	useRealtime({
		channels: [roomId],
		events: ["room.message", "room.destroy"],
		onData: ({ event, data: msg }) => {
			switch (event) {
				case "room.destroy":
					router.push("/?destroyed=true")
					break
				case "room.message":
					queryClient.setQueryData<RoomData>(ROOM_QUERY_KEY, (room) => {
						return addMessage(room!, msg)
					})
					break
			}
		},
	})

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
				{roomData?.messages.length === 0 && (
					<div className="text-muted-foreground flex h-full items-center justify-center">
						No messages!! Start the conversation
					</div>
				)}

				{roomData?.messages.map((msg) => {
					const messageStatus = msg.status
					const isSenderMe = msg.sender === name

					return (
						<ViewTransition key={msg.clientMessageId}>
							<div
								className={cn(
									"transition-opacity",
									messageStatus === "sending" && "animate-pulse opacity-60",
									messageStatus === "failed" && "opacity-80",
								)}
							>
								<div className="mb-1 flex items-baseline gap-3">
									<span
										className={cn(
											"text-xs font-bold uppercase",
											isSenderMe ? "text-primary" : "text-blue-500",
										)}
									>
										{isSenderMe ? "You" : msg.sender}
									</span>
									<span className="text-muted-foreground text-[10px]">
										{formatTimestamp(msg.timestamp)}
									</span>
									{messageStatus === "sending" && (
										<span className="text-muted-foreground text-[10px] uppercase">sending</span>
									)}
									{messageStatus === "failed" && (
										<span className="text-destructive text-[10px] uppercase">failed</span>
									)}
								</div>
								<p className="text-sm leading-relaxed">{msg.content}</p>
							</div>
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
									submitMessage(message)
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
						disabled={!message.trim()}
						onClick={() => {
							submitMessage(message)
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
