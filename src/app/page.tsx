"use client"

import { useMutation } from "@tanstack/react-query"
import { Dice4 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { client } from "@/lib/api-client"
import { generateRandomName } from "@/lib/generate-random-name"

const NAME_KEY = "anon-user-name"

export default function Page() {
	const [name, setName] = useState("")

	const router = useRouter()

	useEffect(() => {
		function main() {
			const storedName = localStorage.getItem(NAME_KEY)

			if (storedName) {
				setName(storedName)
				return
			}

			const randomName = generateRandomName()
			localStorage.setItem(NAME_KEY, randomName)
			setName(randomName)
		}
		main()
	}, [])

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
						<Dice4 className="size-8" onClick={() => setName(generateRandomName())} type="button" />
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
