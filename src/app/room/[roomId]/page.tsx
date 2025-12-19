"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import { formatTime } from "@/lib/format-time"

export default function Page() {
	const [secondsLeft, setSecondsLeft] = useState(100)
	const { roomId } = useParams()

	useEffect(() => {
		const timer = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					clearInterval(timer)
					return 0
				}
				return prev - 1
			})
		}, 1000)
		return () => clearInterval(timer)
	}, [])

	return (
		<div className="w-full border-2 border-red-400">
			<div>Room: {roomId}</div>
			<div>{formatTime(secondsLeft)}</div>
		</div>
	)
}
