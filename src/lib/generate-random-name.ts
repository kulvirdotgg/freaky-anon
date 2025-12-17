import { nanoid } from "nanoid"

const adjectives = [
	"anonymous",
	"silent",
	"quick",
	"clever",
	"mystic",
	"brave",
	"gentle",
	"wise",
	"stealthy",
	"curious",
	"swift",
	"bright",
	"calm",
	"daring",
	"eager",
]

const animals = [
	"gorilla",
	"panda",
	"tiger",
	"eagle",
	"dolphin",
	"fox",
	"wolf",
	"bear",
	"owl",
	"hawk",
	"lynx",
	"otter",
	"raven",
	"falcon",
	"leopard",
]

export function generateRandomName() {
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
	const animal = animals[Math.floor(Math.random() * animals.length)]
	return `${adj}-${animal}-${nanoid(6)}`
}
