import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, Star } from "@/components/Decor";
import { getViewer } from "@/lib/access";
import { adminLoginConfigured } from "@/lib/admin-password";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const viewer = await getViewer();
  if (viewer?.isAdmin) redirect("/admin");

  return (
    <Container narrow>
      <div className="mx-auto max-w-md text-center">
        <Star className="mx-auto h-10 w-10" />
        <h1 className="mt-4 text-4xl font-medium text-brown">Admin sign in</h1>
        <p className="mt-3 text-lg">For Authority administrators only.</p>
      </div>
      <div className="mx-auto mt-8 max-w-md">
        {adminLoginConfigured() ? (
          <AdminLoginForm />
        ) : (
          <p role="alert" className="card text-center">
            Admin password sign-in is not set up yet.
          </p>
        )}
      </div>
    </Container>
  );
}
