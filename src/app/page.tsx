"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/api-client"

export default function Page() {
	const { name } = useUsername()

	const router = useRouter()
	const searchParams = useSearchParams()

	const { isPending, mutate: joinRoom } = useMutation({
		mutationKey: ["join-room"],
		mutationFn: async ({ roomId }: { roomId?: string }) => {
			// biome-ignore lint: like yeah whatever
			let res
			if (roomId) {
				res = await client.room({ roomId }).join.post()
			} else {
				res = await client.room.post()
			}

			if (res.status === 200 || res.status === 201) {
				const id = res.data?.roomId
				if (id) {
					router.push(`/room/${id}`)
				}
			} else if (res.status === 403) {
				const roomId = searchParams.get("room-id")
				const message = res.error?.value.message
				router.push(`/?room-id=${roomId}&error=${message}`)
			}
		},
	})

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-8">
			<Suspense fallback={null}>
				<ErrorCard />
			</Suspense>

			<Card className="w-full max-w-sm p-6 backdrop-blur-xl lg:max-w-md">
				<CardHeader>
					<CardTitle className="text-base text-primary uppercase">
						{"> "}Anonymous ephemeral chat room
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<LabelRow label="user" value={name} />
					<Suspense fallback={null}>
						<RoomIdRow />
					</Suspense>
				</CardContent>
				<CardFooter className="w-full">
					<Suspense
						fallback={
							<Button
								className="w-full font-semibold text-sm"
								disabled={isPending}
								onClick={() => joinRoom({})}
								type="submit"
							>
								create room
							</Button>
						}
					>
						<JoinRoomButton isPending={isPending} joinRoom={joinRoom} />
					</Suspense>
				</CardFooter>
			</Card>
		</main>
	)
}

function ErrorCard() {
	const searchParams = useSearchParams()
	const error = searchParams.get("error") ?? undefined

	if (!error) return null

	return (
		<Card className="w-full max-w-sm bg-red-900/50 py-6 backdrop-blur-xl lg:max-w-md">
			<CardContent className="text-center text-sm uppercase">{error.split("-").join(" ")}</CardContent>
		</Card>
	)
}

function RoomIdRow() {
	const searchParams = useSearchParams()
	const roomId = searchParams.get("room-id") ?? undefined

	if (!roomId) return null

	return <LabelRow label="room-id" value={roomId} />
}

function JoinRoomButton({
	isPending,
	joinRoom,
}: {
	isPending: boolean
	joinRoom: (input: { roomId?: string }) => void
}) {
	const searchParams = useSearchParams()
	const roomId = searchParams.get("room-id") ?? undefined

	return (
		<Button
			className="w-full font-semibold text-sm"
			disabled={isPending}
			onClick={() => joinRoom({ roomId })}
			type="submit"
		>
			{roomId ? "join room" : "create room"}
		</Button>
	)
}

function LabelRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-12">
			<Label className="col-span-2">{label}</Label>
			<Label className="col-span-10 h-8 border-2 border-l-primary/80 px-3 text-foreground/80 text-sm">
				{value}
			</Label>
		</div>
	)
}
