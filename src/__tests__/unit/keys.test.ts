import { issueKey, findKey, rotateKey, revokeKey } from '@/lib/moat/keys'

describe('keys', () => {
	it('issues, finds, rotates, revokes', () => {
		const k = issueKey('free')
		expect(k.keyId).toBeTruthy()
		expect(k.plaintext).toBeTruthy()
		const rec = findKey(k.plaintext)
		expect(rec?.keyId).toBeTruthy()
		const rot = rotateKey(rec!.keyId)
		expect(rot?.plaintext).toBeTruthy()
		const ok = revokeKey(rec!.keyId)
		expect(ok).toBe(true)
	})
})


