"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(e.currentTarget);
    const res = await signIn("admin-login", {
      username: String(data.get("username") ?? ""),
      password: String(data.get("password") ?? ""),
      redirect: false,
    });
    setPending(false);
    if (res?.ok && !res.error) {
      router.replace("/admin");
      router.refresh();
    } else if (res?.error === "rate") {
      setError("Too many attempts. Please wait 15 minutes and try again.");
    } else {
      setError("Wrong username or password.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5" noValidate>
      <div>
        <label htmlFor="admin-username" className="label">
          Username
        </label>
        <input id="admin-username" name="username" autoComplete="username" required className="input mt-1" />
      </div>
      <div>
        <label htmlFor="admin-password" className="label">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input mt-1"
        />
      </div>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      <button type="submit" className="btn w-full justify-center" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
