import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { listFields } from "@/lib/queries";
import { DeleteOfferButton, OfferForm } from "../../forms";

const toInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

/** Edits an offer, or creates one when the id is "new". */
export default async function EditOffer({ params }: PageProps<"/admin/offers/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [fields, offer] = await Promise.all([listFields(), id === "new" ? null : db.offer.findUnique({ where: { id } })]);
  if (id !== "new" && !offer) notFound();

  const values = offer
    ? {
        id: offer.id,
        fieldId: offer.fieldId,
        name: offer.name,
        venue: offer.venue,
        discountText: offer.discountText,
        validFrom: toInput(offer.validFrom),
        validUntil: toInput(offer.validUntil),
        active: offer.active,
      }
    : { fieldId: fields[0]?.id ?? "", name: "", venue: "", discountText: "", validFrom: "", validUntil: "", active: true };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-medium text-brown">{offer ? "Edit offer" : "New offer"}</h1>
        {offer && <DeleteOfferButton id={offer.id} title={offer.name} className="btn btn-sm" />}
      </div>
      <div className="mt-8">
        <OfferForm values={values} fields={fields.map((f) => ({ value: f.id, label: f.name }))} />
      </div>
    </div>
  );
}
