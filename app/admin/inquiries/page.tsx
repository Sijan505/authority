import { formatDate } from "@/components/ArticleCard";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { inquiryRef } from "@/lib/validation";

/** Answers from the public "Request an invitation" questionnaire, newest first. */
export default async function AdminInquiries() {
  await requireAdmin();
  const [inquiries, total] = await Promise.all([db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 }), db.inquiry.count()]);

  return (
    <>
      <h1 className="text-4xl font-medium text-brown">Inquiries</h1>
      <p className="mt-2 text-mute">
        {total} total{total > inquiries.length ? `, showing the latest ${inquiries.length}` : ""}.
      </p>

      {inquiries.length === 0 ? (
        <p className="mt-8">No inquiries yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {inquiries.map((i) => (
            <li key={i.id} className="card">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span>
                    <b className="font-semibold">{i.name}</b> <span className="text-mute">· {i.role}</span>
                  </span>
                  <span className="text-sm text-mute">
                    {i.city} · {formatDate(i.createdAt)} · <span className="tabular-nums">{inquiryRef(i.id)}</span>
                  </span>
                </summary>
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-[0.9375rem] sm:grid-cols-[10rem_1fr]">
                  <dt className="text-mute">Email</dt>
                  <dd>
                    <a href={`mailto:${i.email}`} className="link">
                      {i.email}
                    </a>
                  </dd>
                  {i.whatsapp && (
                    <>
                      <dt className="text-mute">WhatsApp</dt>
                      <dd>
                        <a href={`https://wa.me/${i.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="link">
                          {i.whatsapp}
                        </a>
                      </dd>
                    </>
                  )}
                  <dt className="text-mute">World</dt>
                  <dd>{i.world}</dd>
                  <dt className="text-mute">Working on</dt>
                  <dd className="whitespace-pre-line">{i.building}</dd>
                  {i.link && (
                    <>
                      <dt className="text-mute">Work</dt>
                      <dd className="break-all">{i.link}</dd>
                    </>
                  )}
                  <dt className="text-mute">Would use</dt>
                  <dd>{i.interests.join(", ")}</dd>
                  <dt className="text-mute">Would bring</dt>
                  <dd className="whitespace-pre-line">{i.bring}</dd>
                  <dt className="text-mute">Referred by</dt>
                  <dd>{i.referrer ?? "No one"}</dd>
                  {i.notes && (
                    <>
                      <dt className="text-mute">Notes</dt>
                      <dd className="whitespace-pre-line">{i.notes}</dd>
                    </>
                  )}
                </dl>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
