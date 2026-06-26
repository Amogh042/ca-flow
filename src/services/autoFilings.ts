import type { Filing } from "@/data/workspace";
import type { ClientRecord } from "@/data/workspace";
import type { FilingTemplate } from "@/data/filingTemplates";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDueDate(year: number, month: number, day: number): string {
  const maxDay = new Date(year, month + 1, 0).getDate();
  const d = new Date(year, month, Math.min(day, maxDay));
  return d.toISOString().split("T")[0];
}

function templateApplies(template: FilingTemplate, client: ClientRecord): boolean {
  if (template.entityTypes?.length) {
    if (!template.entityTypes.includes(client.entityType)) return false;
  }

  for (const reg of template.appliesTo) {
    if (reg === "gstin" && !client.gstin) return false;
    if (reg === "pan" && !client.pan) return false;
    if (reg === "tan" && !client.pan) return false;
  }

  return true;
}

function currentFYYear(): number {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function generateFilingsForClient(
  client: ClientRecord,
  templates: FilingTemplate[],
): Omit<Filing, "id">[] {
  const now = new Date();
  const results: Omit<Filing, "id">[] = [];

  for (const tpl of templates) {
    if (!templateApplies(tpl, client)) continue;

    if (tpl.frequency === "monthly") {
      for (let offset = 0; offset < 3; offset++) {
        const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const y = target.getFullYear();
        const m = target.getMonth();
        results.push({
          clientId: client.id,
          title: `${tpl.name} — ${MONTH_NAMES[m]} ${y}`,
          dueDate: formatDueDate(y, m, tpl.dayOfMonth),
          owner: client.owner,
          status: "pending",
          entity: tpl.type,
        });
      }
    } else if (tpl.frequency === "quarterly" && tpl.quarterMonths) {
      let count = 0;
      for (const qm of tpl.quarterMonths) {
        const m = qm - 1;
        let y = now.getFullYear();
        const candidate = new Date(y, m, tpl.dayOfMonth);
        if (candidate < now) {
          y += 1;
        }
        const due = formatDueDate(y, m, tpl.dayOfMonth);
        if (count >= 2) break;
        results.push({
          clientId: client.id,
          title: `${tpl.name} — Q${count + 1} (${MONTH_NAMES[m]} ${y})`,
          dueDate: due,
          owner: client.owner,
          status: "pending",
          entity: tpl.type,
        });
        count++;
      }
    } else if (tpl.frequency === "yearly" && tpl.yearMonth != null) {
      const fyStart = currentFYYear();
      const m = tpl.yearMonth - 1;
      let y = m >= 3 ? fyStart : fyStart + 1;
      const candidate = new Date(y, m, tpl.dayOfMonth);
      if (candidate < now) {
        y += 1;
      }
      results.push({
        clientId: client.id,
        title: `${tpl.name} — FY ${fyStart}-${(fyStart + 1).toString().slice(2)}`,
        dueDate: formatDueDate(y, m, tpl.dayOfMonth),
        owner: client.owner,
        status: "pending",
        entity: tpl.type,
      });
    }
  }

  return results;
}
