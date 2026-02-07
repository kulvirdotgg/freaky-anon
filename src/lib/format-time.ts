export function formatSecondsToMinutes(seconds: number) {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function formatTimestamp(timestamp: number) {
	const date = new Date(timestamp)
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	})
}
