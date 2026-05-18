import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/auth-token";
import { verifySession } from "@/lib/auth-db";
import { AppHeader } from "@/features/app-header/app-header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(COOKIE_NAME)?.value;

  if (!token || !(await verifySession(token))) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
