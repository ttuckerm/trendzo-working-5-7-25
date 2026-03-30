import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function loadMatrix(page) {
	const res = await page.request.get('/config/objectives.matrix.json');
	expect(res.ok()).toBeTruthy();
	return await res.json();
}

test.describe('Objectives Preflight', () => {
	test('all objectives pass QA overlay checks', async ({ page }) => {
		const matrix = await loadMatrix(page);
		const summaryArr: any[] = [];
		for (const obj of matrix.objectives) {
			const url = `${obj.route}?qa=1${obj.anchor || ''}`;
			await page.goto(url, { waitUntil: 'domcontentloaded' });
			await page.waitForSelector('[data-testid="qa-overlay"]');
			const summaryText = await page.locator('[data-testid="qa-summary"]').innerText();
			const pass = summaryText.includes('ALL CHECKS PASS');
			summaryArr.push({ id: obj.id, route: obj.route, pass });
			expect(pass).toBeTruthy();
		}
		const artifactsDir = path.join(process.cwd(), 'public', 'artifacts');
		if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
		fs.writeFileSync(path.join(artifactsDir, 'preflight-summary.json'), JSON.stringify(summaryArr, null, 2));
	});
});


