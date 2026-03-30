import fs from 'fs'
import path from 'path'

export type MoatFlags = { publicApi: boolean; insights: boolean }

const FLAGS_FILE = path.join(process.cwd(), 'fixtures', 'flags.json')

function ensureDir() {
	const dir = path.dirname(FLAGS_FILE)
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeAtomic(file: string, data: unknown) {
	ensureDir()
	const tmp = file + '.tmp'
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
	fs.renameSync(tmp, file)
}

const DEFAULT_FLAGS: MoatFlags = { publicApi: true, insights: true }

export function getFlags(): MoatFlags {
	try {
		const raw = JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf8'))
		return { ...DEFAULT_FLAGS, ...raw }
	} catch {
		writeAtomic(FLAGS_FILE, DEFAULT_FLAGS)
		return DEFAULT_FLAGS
	}
}

export function setFlag(name: keyof MoatFlags, value: boolean): MoatFlags {
	const cur = getFlags()
	const next = { ...cur, [name]: !!value }
	writeAtomic(FLAGS_FILE, next)
	return next
}


