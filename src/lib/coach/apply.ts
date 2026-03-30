import type { CoachEdit, CoachInput } from './types'

export function applyEdit(input: CoachInput, edit: CoachEdit): CoachInput {
	return {
		...input,
		scriptText: edit.scriptText !== undefined ? edit.scriptText : input.scriptText,
		caption: edit.caption !== undefined ? edit.caption : input.caption,
		templateId: edit.templateId !== undefined ? edit.templateId : input.templateId,
	}
}

export function computeUnifiedDiff(oldText: string, newText: string, header = 'content'): string {
	function lines(s: string){ return (s||'').split(/\r?\n/) }
	const a = lines(oldText)
	const b = lines(newText)
	const out = [ `--- a/${header}`, `+++ b/${header}` ]
	const max = Math.max(a.length, b.length)
	for (let i=0;i<max;i++) {
		const la = a[i] ?? ''
		const lb = b[i] ?? ''
		if (la !== lb) {
			if (la) out.push(`- ${la}`)
			if (lb) out.push(`+ ${lb}`)
		}
	}
	return out.join('\n')
}


