import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/shell/Topbar";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  const path = (await headers()).get("x-pathname") || "";
  if (user.mustChangePassword && path !== "/cuenta") redirect("/cuenta");
  return (
    <>
      <Topbar name={user.name} role={user.role} />
      {children}
    </>
  );
}
