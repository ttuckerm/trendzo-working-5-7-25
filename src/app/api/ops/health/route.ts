import { NextRequest, NextResponse } from 'next/server';
import { alertManager } from '@/lib/monitoring/alert-manager';

export async function GET(_req: NextRequest) {
	try {
		const active = alertManager.getActiveAlerts();
		const open_incidents = active.length;
		const degraded_services = Array.from(new Set(active.map(a => a.service).filter(Boolean)));
		return NextResponse.json({ status: 'ok', open_incidents, degraded_services });
	} catch (err: any) {
		return NextResponse.json({ status: 'degraded', open_incidents: 0, degraded_services: [] });
	}
}


