import http, { type BatchRequests } from "k6/http"
import { check, fail } from "k6"
import { Counter } from "k6/metrics"

export const options = {
	vus: 1,
	iterations: 1,
	thresholds: {
		room_join_req_success: ["count==1"],
		room_full_req_failed: ["count==9"],
		req_failed: ["count==0"],
		checks: ["rate==1.0"],
	},
}

const NANOID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
function nanoid(): string {
	let id = ""
	// default nanoid length is 21
	for (let idx = 0; idx < 21; idx += 1) {
		id += NANOID_ALPHABET[Math.floor(Math.random() * NANOID_ALPHABET.length)]
	}
	return id
}

const BASE_URL = "http://localhost:3000"
const USER_ID_COOKIE = "x-user-id"
const JOIN_ATTEMPTS = 10

const joinsCounter = new Counter("room_join_req_success")
const roomFullCounter = new Counter("room_full_req_failed")
const requestFailedCounter = new Counter("req_failed")

export default function (): void {
	const roomRes = http.post(`${BASE_URL}/api/room`)

	const roomCreated = check(roomRes, {
		"create room returned expected status": (res) => res.status === 201,
	})
	if (!roomCreated) {
		fail(`Expected create-room status 201, got ${roomRes.status}. Response ${roomRes}`)
	}

	const roomJson = JSON.parse(roomRes.body as string)
	const roomId = roomJson["roomId"]
	const joinRequests: BatchRequests = Array.from({ length: JOIN_ATTEMPTS }).map(() => ({
		method: "POST",
		url: `${BASE_URL}/api/room/${roomId}/join`,
		params: {
			headers: {
				// overwrite the user-id cookie with new user-id
				// otherwise, all requests will have same user-id as the request which created room
				// this, will defeat the purpose of test, because that user is always part of room
				// hence API always return 200 response
				Cookie: `${USER_ID_COOKIE}=${nanoid()}`,
			},
		},
	}))

	const batchRes = http.batch(joinRequests)
	batchRes.forEach((res) => {
		const status = res.status
		if (status === 200) {
			joinsCounter.add(1)
		} else if (status === 403) {
			roomFullCounter.add(1)
		} else {
			requestFailedCounter.add(1)
		}
	})
}
