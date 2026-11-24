"use client";

import { useActionState } from "react";
import { adminRemovePhoto, adminResetCardCode, adminSetMembership, adminUpdateProfile } from "@/app/actions/admin-members";
import { FieldError, FormMessage, SubmitButton } from "@/components/forms";
import { cities } from "@/config/site";
import type { ActionState } from "@/lib/validation";

const initial: ActionState = {};

type Profile = { name: string; fieldId: string; city: string; contact: string; status: "ACTIVE" | "SUSPENDED"; role: "MEMBER" | "ADMIN" };

/** Name, field, city, contact, status and role. */
export function ProfileForm({ userId, profile, fields, isSelf }: { userId: string; profile: Profile; fields: { value: string; label: string }[]; isSelf: boolean }) {
  const [state, action] = useActionState(adminUpdateProfile, initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="block sm:col-span-2">
        <span className="text-sm text-mute">Name</span>
        <input name="name" defaultValue={profile.name} maxLength={120} required className="input mt-1" />
        <FieldError id="e-name" message={e.name} />
      </label>
      <label className="block">
        <span className="text-sm text-mute">Field</span>
        <select name="fieldId" defaultValue={profile.fieldId} className="input mt-1">
          <option value="">Not set</option>
          {fields.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <FieldError id="e-field" message={e.fieldId} />
      </label>
      <label className="block">
        <span className="text-sm text-mute">City</span>
        <select name="city" defaultValue={profile.city} className="input mt-1">
          <option value="">Not set</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <FieldError id="e-city" message={e.city} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm text-mute">Contact (email or WhatsApp)</span>
        <input name="contact" defaultValue={profile.contact} maxLength={200} className="input mt-1" />
        <FieldError id="e-contact" message={e.contact} />
      </label>
      <label className="block">
        <span className="text-sm text-mute">Account status</span>
        <select name="status" defaultValue={profile.status} disabled={isSelf} className="input mt-1">
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended (can&apos;t sign in)</option>
        </select>
        {isSelf && <input type="hidden" name="status" value={profile.status} />}
        <FieldError id="e-status" message={e.status} />
      </label>
      <label className="block">
        <span className="text-sm text-mute">Role</span>
        <select name="role" defaultValue={profile.role} disabled={isSelf} className="input mt-1">
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin (full admin panel access)</option>
        </select>
        {isSelf && <input type="hidden" name="role" value={profile.role} />}
        <FieldError id="e-role" message={e.role} />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-sm">Save account settings</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

/** Make a member until a date (start, extend or shorten), or end the membership now. */
export function MembershipForm({ userId, isMember, defaultUntil }: { userId: string; isMember: boolean; defaultUntil: string }) {
  const [setState, setAction] = useActionState(adminSetMembership, initial);
  const [endState, endAction] = useActionState(adminSetMembership, initial);
  return (
    <div className="space-y-5">
      <form action={setAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="mode" value="set" />
        <label className="block">
          <span className="text-sm text-mute">{isMember ? "Member until" : "Give membership until"}</span>
          <input type="date" name="until" defaultValue={defaultUntil} required className="input mt-1" />
          <FieldError id="e-until" message={setState.errors?.until} />
        </label>
        <SubmitButton className="btn btn-sm">{isMember ? "Change end date" : "Start membership"}</SubmitButton>
        <div className="w-full">
          <FormMessage state={setState} />
          {!isMember && <p className="text-sm text-mute">No payment is recorded for a membership started here.</p>}
        </div>
      </form>
      {isMember && (
        <form
          action={endAction}
          onSubmit={(ev) => {
            if (!window.confirm("End this membership now? They lose member access straight away.")) ev.preventDefault();
          }}
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="mode" value="end" />
          <SubmitButton className="btn btn-sm btn-alt">End membership now</SubmitButton>
          <FormMessage state={endState} />
        </form>
      )}
    </div>
  );
}

export function RemovePhotoButton({ userId }: { userId: string }) {
  const [state, action] = useActionState(adminRemovePhoto, initial);
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton className="btn btn-sm btn-alt">Remove photo</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function ResetCardButton({ userId }: { userId: string }) {
  const [state, action] = useActionState(adminResetCardCode, initial);
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm("Reset this member's card QR code? The old QR stops working at once.")) ev.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton className="btn btn-sm btn-alt">Reset card QR code</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
