import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { inquiryRef } from "@/lib/validation";

// Spreadsheet apps run cells that start with = + - @ as formulas; prefix them so a
// visitor's answer can't become one.
const cell = (v: unknown) => {
  let s = Array.isArray(v) ? v.join("; ") : v instanceof Date ? v.toISOString() : String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every interest sign-up as a CSV file, for the results sheet. Admins only. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return new Response("Not found", { status: 404 });

  const rows = await db.inquiry.findMany({ orderBy: { createdAt: "asc" } });
  const head = [
    "Reference",
    "Date",
    "Name",
    "Field",
    "City",
    "Contact",
    "Contact type",
    "Perks",
    "Price band",
    "Deposit",
    "Help build",
    "Contribution",
    "Source",
    "Source detail",
    // First version of the form
    "Email (v1)",
    "WhatsApp (v1)",
    "World (v1)",
    "Role (v1)",
    "Working on (v1)",
    "Would use (v1)",
    "Would bring (v1)",
    "Referrer (v1)",
    "Notes (v1)",
  ];
  const lines = rows.map((r) =>
    [
      inquiryRef(r.id),
      r.createdAt,
      r.name,
      r.field,
      r.city,
      r.contact,
      r.contactType,
      r.perks,
      r.priceBand,
      r.deposit,
      r.helpBuild,
      r.contribution,
      r.source,
      r.sourceDetail,
      r.email,
      r.whatsapp,
      r.world,
      r.role,
      r.building,
      r.interests,
      r.bring,
      r.referrer,
      r.notes,
    ]
      .map(cell)
      .join(","),
  );
  const date = new Date().toISOString().slice(0, 10);
  // A byte-order mark so Excel reads the Nepali and the Rs symbols as UTF-8.
  return new Response("﻿" + [head.join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="authority-interest-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
