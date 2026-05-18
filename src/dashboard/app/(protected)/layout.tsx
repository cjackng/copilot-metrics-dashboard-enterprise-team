import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-token";
import { getPasswordHash } from "@/lib/auth-db";
import { AppHeader } from "@/features/app-header/app-header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const passwordHash = token ? await getPasswordHash() : null;

  if (!token || !passwordHash || !(await verifyToken(token, passwordHash))) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}

