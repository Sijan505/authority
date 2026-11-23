import { formatDate } from "@/components/ArticleCard";
import { cities, contributionOptions, helpOptions, inquiryFields, inquirySources, successTarget } from "@/config/site";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { inquiryRef } from "@/lib/validation";
import { BarList } from "../charts";

/** Interest-test results and every sign-up from the public form, newest first. */
export default async function AdminInquiries() {
  await requireAdmin();
  const [inquiries, total, answers] = await Promise.all([
    db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.inquiry.count(),
    // Only sign-ups from the current form have these answers.
    db.inquiry.findMany({
      where: { field: { not: null } },
      select: { field: true, city: true, helpBuild: true, source: true, contribution: true },
    }),
  ]);

  const n = answers.length;
  const count = (key: "field" | "city" | "helpBuild" | "source", options: readonly string[]) =>
    options.map((o) => ({ label: o, value: answers.filter((a) => a[key] === o).length }));
  const countList = (key: "contribution", options: readonly string[]) =>
    options.map((o) => ({ label: o, value: answers.filter((a) => a[key].includes(o)).length })).sort((a, b) => b.value - a.value);

  const helpers = answers.filter((a) => a.helpBuild === helpOptions[0]).length;
  const maybe = answers.filter((a) => a.helpBuild === helpOptions[1]).length;
  const targets = [
    { label: "Sign-ups", value: n, goal: successTarget.signups, show: `${n} / ${successTarget.signups}` },
    { label: "Want to help build it", value: helpers, goal: successTarget.helpers, show: `${helpers} / ${successTarget.helpers}` },
    { label: "Maybe, tell me more", value: maybe, goal: 0, show: String(maybe) },
  ];

  const breakdowns = [
    { title: "By field", rows: count("field", inquiryFields) },
    { title: "By city", rows: count("city", cities) },
    { title: "Help build Authority", rows: count("helpBuild", helpOptions) },
    { title: "Where they found us", rows: count("source", inquirySources).sort((a, b) => b.value - a.value) },
    { title: "Could contribute", rows: countList("contribution", contributionOptions) },
  ];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-4xl font-medium text-brown">Interest sign-ups</h1>
        <a href="/api/admin/inquiries" className="btn btn-alt" download>
          Download CSV
        </a>
      </div>
      <p className="mt-2 text-mute">
        {total} total{total > inquiries.length ? `, showing the latest ${inquiries.length}` : ""}. One sign-up per email or WhatsApp number.
      </p>

      <section aria-labelledby="target" className="mt-8 card">
        <h2 id="target" className="text-2xl font-medium text-brown">
          Against the success target
        </h2>
        <p className="hint">Targets are set in config/site.ts (successTarget). Results use the {n} sign-ups from the current form.</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {targets.map((x) => {
            const met = x.goal > 0 && x.value >= x.goal;
            return (
              <div key={x.label} className={`rounded-lg border px-3 py-4 ${met ? "border-gold bg-gold/10" : "border-gold/30"}`}>
                <dt className="text-sm text-ink">{x.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-brown">{x.show}</dd>
                {x.goal > 0 && <dd className="text-xs text-mute">{met ? "Target met" : "Not yet"}</dd>}
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="results" className="mt-8 card">
        <h2 id="results" className="text-2xl font-medium text-brown">
          Results
        </h2>
        <div className="mt-2 grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
          {breakdowns.map((b) => (
            <div key={b.title}>
              <h3 className="mt-3 text-lg font-semibold text-brown">{b.title}</h3>
              <BarList rows={b.rows} total={n} empty="No sign-ups yet." />
            </div>
          ))}
        </div>
      </section>

      <h2 className="mt-12 text-2xl font-medium text-brown">Every sign-up</h2>
      {inquiries.length === 0 ? (
        <p className="mt-4">No sign-ups yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {inquiries.map((i) => {
            const contact = i.contact ?? i.email;
            const isWhatsApp = i.contactType === "whatsapp";
            const rows: [string, React.ReactNode][] = [
              [
                isWhatsApp ? "WhatsApp" : "Email",
                contact ? (
                  <a
                    href={isWhatsApp ? `https://wa.me/${contact.replace(/\D/g, "")}` : `mailto:${contact}`}
                    target={isWhatsApp ? "_blank" : undefined}
                    rel={isWhatsApp ? "noopener noreferrer" : undefined}
                    className="link"
                  >
                    {contact}
                  </a>
                ) : null,
              ],
              ["Their craft", i.craft],
              ["About them", i.about],
              ["Help build", i.helpBuild],
              ["Could contribute", i.contribution.join(", ")],
              ["Found us via", i.source && [i.source, i.sourceDetail].filter(Boolean).join(" · ")],
              // Earlier versions of the form
              ["Perks", i.perks.join(", ")],
              ["Would pay per year", i.priceBand],
              ["Founding deposit", i.deposit],
              ["WhatsApp", i.whatsapp],
              ["World", i.world],
              ["Role", i.role],
              ["Working on", i.building],
              ["Work", i.link],
              ["Would use", i.interests.join(", ")],
              ["Would bring", i.bring],
              ["Referred by", i.referrer],
              ["Notes", i.notes],
            ];
            return (
              <li key={i.id} className="card">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span>
                      <b className="font-semibold">{i.name}</b> <span className="text-mute">· {i.field ?? i.role ?? "First form"}</span>
                      {i.helpBuild === helpOptions[0] && <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-xs text-brown">Wants to help</span>}
                    </span>
                    <span className="text-sm text-mute">
                      {i.city} · {formatDate(i.createdAt)} · <span className="tabular-nums">{inquiryRef(i.id)}</span>
                    </span>
                  </summary>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 text-[0.9375rem] sm:grid-cols-[10rem_1fr]">
                    {rows
                      .filter(([, v]) => v !== null && v !== undefined && v !== "")
                      .map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-mute">{k}</dt>
                          <dd className="break-words whitespace-pre-line">{v}</dd>
                        </div>
                      ))}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
