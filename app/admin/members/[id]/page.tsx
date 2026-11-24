import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/ArticleCard";
import { Avatar } from "@/components/Avatar";
import { cycleLabels, formatNPR, paymentMethods } from "@/config/pricing";
import { requireAdmin } from "@/lib/access";
import { memberNumberOf } from "@/lib/app";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";
import { listFields } from "@/lib/queries";
import { MembershipForm, ProfileForm, RemovePhotoButton, ResetCardButton } from "./forms";

export const metadata = { title: "Member" };

const nepalDate = (d: Date) => new Date(d.getTime() + (5 * 60 + 45) * 60 * 1000).toISOString().slice(0, 10);

/** One member: details, and every account setting an admin can change. Admin only. */
export default async function AdminMember({ params }: PageProps<"/admin/members/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const now = new Date();

  const user = await db.user.findUnique({
    where: { id },
    include: {
      field: { select: { name: true } },
      application: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 20 },
      payments: { orderBy: { createdAt: "desc" }, take: 20, include: { subscription: { select: { billingCycle: true } } } },
    },
  });
  if (!user) notFound();

  const [fields, connections, requests, messagesSent, history] = await Promise.all([
    listFields(),
    db.connection.count({ where: { status: "ACCEPTED", OR: [{ requesterId: id }, { addresseeId: id }] } }),
    db.conciergeRequest.count({ where: { userId: id } }),
    db.message.count({ where: { senderId: id } }),
    db.auditLog.findMany({ where: { targetId: id }, orderBy: { createdAt: "desc" }, take: 15, include: { actor: { select: { name: true } } } }),
  ]);
  const current = user.subscriptions.find((s) => s.package === "PRO" && s.status === "ACTIVE" && s.startsAt && s.startsAt <= now && s.expiresAt && s.expiresAt > now);
  const until = user.subscriptions
    .filter((s) => s.package === "PRO" && s.status === "ACTIVE" && s.expiresAt && s.expiresAt > now)
    .reduce<Date | null>((max, s) => (!max || s.expiresAt! > max ? s.expiresAt! : max), null);
  const number = current ? await memberNumberOf(id) : null;
  const defaultUntil = nepalDate(until ?? new Date(now.getTime() + 30 * 86_400_000));

  return (
    <>
      <Link href="/admin/members" className="link text-sm">
        ← All members
      </Link>

      <section className="mt-4 card flex flex-wrap items-center gap-5">
        <Avatar name={user.name} image={photoUrl(user)} size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-medium text-brown">
            {user.name ?? "—"}
            {user.role === "ADMIN" && <span className="ml-2 align-middle text-sm text-gold-dark">admin</span>}
            {user.status === "SUSPENDED" && <span className="ml-2 align-middle text-sm text-error">suspended</span>}
          </h1>
          <p className="mt-1 break-all text-sm text-mute">{user.email}</p>
          <p className="mt-2 text-sm">
            {current ? (
              <>
                <b className="text-brown">Member</b>
                {number && <> · Member no. {String(number).padStart(3, "0")}</>} · until {formatDate(until)}
              </>
            ) : user.onboardedAt ? (
              "Signed up, not a member"
            ) : (
              "Hasn't finished setup"
            )}
            {" · "}
            {user.field?.name ?? "No field"} · {user.city ?? "No city"} · Joined {formatDate(user.createdAt)}
          </p>
          <p className="mt-1 text-xs text-mute">Account ID: {user.id}</p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-xl font-medium text-brown">Account settings</h2>
          <ProfileForm
            userId={user.id}
            isSelf={user.id === admin.user.id}
            fields={fields.map((f) => ({ value: f.id, label: f.name }))}
            profile={{ name: user.name ?? "", fieldId: user.fieldId ?? "", city: user.city ?? "", contact: user.contact ?? "", status: user.status, role: user.role }}
          />
        </section>

        <section className="card">
          <h2 className="mb-4 text-xl font-medium text-brown">Membership</h2>
          <MembershipForm userId={user.id} isMember={!!current} defaultUntil={defaultUntil} />
          {user.subscriptions.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="table-admin text-sm">
                <thead>
                  <tr>
                    <th scope="col">Period</th>
                    <th scope="col">Billing</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.startsAt ? `${formatDate(s.startsAt)} – ${formatDate(s.expiresAt)}` : "Not started"}</td>
                      <td>{cycleLabels[s.billingCycle]}</td>
                      <td>{s.status.replace("_", " ").toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-xl font-medium text-brown">Payments</h2>
          {user.payments.length === 0 ? (
            <p className="text-sm text-mute">No payments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-admin text-sm">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Method</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.payments.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDate(p.createdAt)}</td>
                      <td>
                        {formatNPR(p.amount)} <span className="text-mute">{cycleLabels[p.subscription.billingCycle].toLowerCase()}</span>
                      </td>
                      <td>{paymentMethods[p.method].name}</td>
                      <td>{p.status.toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link href="/admin/payments" className="link mt-3 inline-block text-sm">
            Review payments →
          </Link>
        </section>

        <section className="card">
          <h2 className="mb-4 text-xl font-medium text-brown">Photo and card</h2>
          <div className="flex flex-wrap gap-3">
            {user.photoUpdatedAt && <RemovePhotoButton userId={user.id} />}
            <ResetCardButton userId={user.id} />
          </div>
          <p className="mt-3 text-sm text-mute">
            {user.photoUpdatedAt ? "They uploaded their own photo." : "Using their Google photo."} Resetting the card issues a new QR; the old one stops working.
          </p>
          <h3 className="mt-6 font-semibold text-brown">Activity</h3>
          <p className="text-sm">
            {connections} connection{connections === 1 ? "" : "s"} · {messagesSent} message{messagesSent === 1 ? "" : "s"} sent · {requests} Request Desk request
            {requests === 1 ? "" : "s"}
          </p>
        </section>

        {user.application && (
          <section className="card">
            <h2 className="mb-4 text-xl font-medium text-brown">Onboarding answers</h2>
            <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
              <dt className="text-mute">Perks</dt>
              <dd>{user.application.perks.join(", ") || "—"}</dd>
              <dt className="text-mute">Help build</dt>
              <dd>{user.application.helpBuild}</dd>
              {user.application.contribution && (
                <>
                  <dt className="text-mute">Could contribute</dt>
                  <dd className="whitespace-pre-line">{user.application.contribution}</dd>
                </>
              )}
              {user.application.deposit && (
                <>
                  <dt className="text-mute">Deposit (earlier)</dt>
                  <dd>{user.application.deposit}</dd>
                </>
              )}
            </dl>
          </section>
        )}

        <section className="card">
          <h2 className="mb-4 text-xl font-medium text-brown">Recent admin changes</h2>
          {history.length === 0 ? (
            <p className="text-sm text-mute">None yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  <span className="text-mute">{formatDate(h.createdAt)}</span> · {h.action.replace("member.", "").replaceAll("_", " ")}
                  {h.actor?.name && <span className="text-mute"> by {h.actor.name}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
