"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/api-client"

export default function Page() {
	const router = useRouter()

	const { name } = useUsername()

	const { mutate: joinRoom } = useMutation({
		mutationKey: ["join-chat-room"],
		mutationFn: async () => {
			const res = await client.room.post({ ttl: 180 })

			const roomId = res.data?.roomId
			if (res.status === 201) {
				router.push(`/room/${roomId}`)
			}
		},
	})

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<Card className="w-full max-w-md p-6 backdrop-blur-xl">
				<CardHeader>
					<CardTitle className="text-base text-primary">{">"}Anonymous and ephemeral chat rooms</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<Label className="flex-1 border-2 px-3 py-1 text-foreground/80 text-sm">{name}</Label>
						{/*<Dice4 className="size-8" type="button" />*/}
					</div>
				</CardContent>
				<CardFooter className="w-full">
					<Button className="w-full font-semibold text-sm" onClick={() => joinRoom()} type="button">
						join anon chat room
					</Button>
				</CardFooter>
			</Card>
		</main>
	)
}
