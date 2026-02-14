"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import { Copy, CopyCheck } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { client } from "@/lib/api-client"
import { formatSecondsToMinutes } from "@/lib/format-time"

export default function RoomLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const params = useParams()
	const roomId = params.roomId as string

	const [isCopied, setIsCopied] = useState(false)

	const { data: roomData, isLoading } = useQuery({
		queryKey: ["room", roomId],
		queryFn: async () => {
			const res = await client.room({ roomId }).get()
			return res.data
		},
	})

	const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

	useEffect(() => {
		if (roomData?.ttl) {
			setSecondsLeft(roomData.ttl)
		}
	}, [roomData?.ttl])

	const copyLink = () => {
		const url = new URL(window.location.origin)
		url.searchParams.set("room-id", roomId)

		window.navigator.clipboard.writeText(url.toString())

		setIsCopied(true)
		setTimeout(() => setIsCopied(false), 2 * 1000)
	}

	const router = useRouter()

	useEffect(() => {
		if (secondsLeft === null) return

		if (secondsLeft <= 0) {
			router.push("/?destroyed=true")
			return
		}

		const timer = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(timer)
					return 0
				}
				return prev - 1
			})
		}, 1000)
		return () => clearInterval(timer)
	}, [router, secondsLeft])

	const { mutate: destroyRoom } = useMutation({
		mutationKey: ["destroy-room"],
		mutationFn: async () => {
			await client.room({ roomId }).delete()
		},
	})

	return (
		<main className="flex h-screen flex-col">
			<header className="bg-background/30 flex items-center justify-between border-b p-4">
				<div className="flex items-center gap-4">
					<div className="flex flex-col">
						<span className="text-xs uppercase">Room ID</span>
						<div className="flex items-center gap-2">
							<code className="text-accent text-sm font-bold">{roomId}</code>
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
					<div className="bg-secondary h-8 w-px" />
					<div className="flex flex-col">
						<span className="text-xs uppercase">Self Destruct</span>
						{isLoading ? (
							<Skeleton className="h-6 w-10" />
						) : (
							<span
								className={clsx("text-amber-500", secondsLeft && secondsLeft <= 60 && "text-rose-500")}
							>
								{formatSecondsToMinutes(secondsLeft ?? 0)}
							</span>
						)}
					</div>
				</div>
				<Button className="font-bold uppercase" onClick={() => destroyRoom()} variant="destructive">
					destroy room
				</Button>
			</header>
			{children}
		</main>
	)
}
