// Lightweight client-side export helpers (sandbox-only)

export function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSRT(lines: { start: number; end: number; text: string }[]) {
  let idx = 1;
  const toTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    const ms = Math.floor((sec % 1) * 1000)
      .toString()
      .padStart(3, "0");
    return `${h}:${m}:${s},${ms}`;
  };
  const content = lines
    .map((l) => `${idx++}\n${toTime(l.start)} --> ${toTime(l.end)}\n${l.text}\n`)
    .join("\n");
  downloadText("script.srt", content, "text/plain;charset=utf-8");
}

export function exportICS(events: { title: string; startISO: string; endISO: string; description?: string }[]) {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SandboxWorkflow//EN",
  ];
  const footer = ["END:VCALENDAR"];
  const body = events
    .map((e, i) => [
      "BEGIN:VEVENT",
      `UID:sandbox-${i}@workflow`,
      `DTSTAMP:${e.startISO.replace(/[-:]/g, "").replace(".000Z", "Z")}`,
      `DTSTART:${e.startISO.replace(/[-:]/g, "").replace(".000Z", "Z")}`,
      `DTEND:${e.endISO.replace(/[-:]/g, "").replace(".000Z", "Z")}`,
      `SUMMARY:${e.title}`,
      e.description ? `DESCRIPTION:${e.description}` : undefined,
      "END:VEVENT",
    ].filter(Boolean).join("\n"))
    .join("\n");
  const content = [...header, body, ...footer].join("\n");
  downloadText("schedule.ics", content, "text/calendar;charset=utf-8");
}

export function exportCSV(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) {
    downloadText(filename, "", "text/csv;charset=utf-8");
    return;
  }
  const header = Object.keys(rows[0]);
  const esc = (v: any) => String(v ?? "").replace(/"/g, '""');
  const content = [header.join(","), ...rows.map((r) => header.map((h) => `"${esc((r as any)[h])}` + '"').join(","))].join("\n");
  downloadText(filename, content, "text/csv;charset=utf-8");
}

export function exportTXT(filename: string, lines: string[]) {
  downloadText(filename, lines.join("\n"), "text/plain;charset=utf-8");
}

export async function exportPDFStub(filename = "report.pdf") {
  // Minimal placeholder PDF: we'll provide a simple text PDF header for demo purposes
  const content = "%PDF-1.4\n% Sandbox PDF stub\n";
  downloadText(filename, content, "application/pdf");
}


