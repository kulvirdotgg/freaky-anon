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
	return (
		<Suspense>
			<Home />
		</Suspense>
	)
}

function Home() {
	const { name } = useUsername()

	const router = useRouter()
	const searchParams = useSearchParams()

	const roomId = searchParams.get("room-id") ?? undefined
	const error = searchParams.get("error")
	const destroyed = searchParams.get("destroyed")

	const { isPending, mutate: joinRoom } = useMutation({
		mutationKey: ["join-room"],
		mutationFn: async ({ roomId }: { roomId?: string }) => {
			let res
			if (roomId) {
				res = await client.room({ roomId }).join.post()
			} else {
				res = await client.room.post()
			}

			switch (res.status) {
				case 200:
				case 201:
					const id = res.data?.roomId
					if (id) {
						router.push(`/room/${id}`)
					}
					break
				case 403:
					const message = res.error?.value
					router.push(`/?room-id=${roomId}&error=${message}`)
			}
		},
	})

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-8">
			{(error || destroyed) && (
				<Card className="w-full max-w-sm bg-red-900/50 py-6 backdrop-blur-xl lg:max-w-md">
					<CardContent className="text-center text-sm uppercase">
						{error ? error.split("-").join(" ") : destroyed}
					</CardContent>
				</Card>
			)}

			<Card className="w-full max-w-sm p-6 backdrop-blur-xl lg:max-w-md">
				<CardHeader>
					<CardTitle className="text-primary text-base uppercase">
						{"> "}Anonymous ephemeral chat room
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<LabelRow label="user" value={name} />
					{roomId && <LabelRow label="room-id" value={roomId} />}
				</CardContent>
				<CardFooter className="w-full">
					<Button
						className="w-full text-sm font-semibold"
						disabled={isPending}
						onClick={() => joinRoom({ roomId })}
						type="submit"
					>
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
			<Label className="border-l-primary/80 text-foreground/80 col-span-10 h-8 border-2 px-3 text-sm">
				{value}
			</Label>
		</div>
	)
}
