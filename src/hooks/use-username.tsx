import { useEffect, useState } from "react"
import { generateRandomName } from "@/lib/generate-random-name"

const NAME_KEY = "anon-name"

export function useUsername() {
	const [name, setName] = useState("")

	useEffect(() => {
		function main() {
			let name = localStorage.getItem(NAME_KEY)
			if (name) {
				setName(name)
				return
			}

			name = generateRandomName()
			localStorage.setItem(NAME_KEY, name)
			setName(name)
		}
		main()
	}, [])

	return { name }
}
