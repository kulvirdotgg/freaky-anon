"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/api-client"

export default function Page() {
	const searchParams = useSearchParams()
	const roomId = searchParams.get("room-id") ?? undefined

	const { name } = useUsername()

	const router = useRouter()
	const { mutate: joinRoom } = useMutation({
		mutationKey: ["join-room"],
		mutationFn: async ({ roomId }: { roomId?: string }) => {
			const res = await client.room.post({ roomId })

			if (res.status === 201) {
				const roomId = res.data?.roomId
				router.push(`/room/${roomId}`)
			}

			console.log(res.error?.value)
		},
	})

	return (
		<main className="flex min-h-screen items-center justify-center">
			<Card className="w-full max-w-md p-6 backdrop-blur-xl">
				<CardHeader>
					<CardTitle className="text-base text-primary">{"> "}Anonymous and ephemeral chat rooms</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<LabelRow label="user" value={name} />
					{roomId && <LabelRow label="room-id" value={roomId} />}
				</CardContent>
				<CardFooter className="w-full">
					<Button className="w-full font-semibold text-sm" onClick={() => joinRoom({ roomId })} type="submit">
						{roomId ? "join room" : "create room"}
					</Button>
				</CardFooter>
			</Card>
		</main>
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
