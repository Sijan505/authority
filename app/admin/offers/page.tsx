import Link from "next/link";
import { formatDate } from "@/components/ArticleCard";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";

export default async function AdminOffers() {
  await requireAdmin();
  const offers = await db.offer.findMany({
    orderBy: [{ field: { position: "asc" } }, { createdAt: "desc" }],
    include: { field: { select: { name: true } } },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-medium text-brown">Offers</h1>
        <Link href="/admin/offers/new" className="btn btn-sm">
          New offer
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th scope="col">Offer</th>
              <th scope="col">Venue</th>
              <th scope="col">Field</th>
              <th scope="col">Discount</th>
              <th scope="col">Validity</th>
              <th scope="col">Active</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/offers/${o.id}`} className="link">
                    {o.name}
                  </Link>
                </td>
                <td>{o.venue}</td>
                <td>{o.field.name}</td>
                <td>{o.discountText}</td>
                <td className="text-sm">
                  {o.validFrom ? formatDate(o.validFrom) : "—"} – {o.validUntil ? formatDate(o.validUntil) : "—"}
                </td>
                <td>{o.active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
