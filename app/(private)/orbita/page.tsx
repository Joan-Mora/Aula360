import { Orbit } from "@/components/orbit/Orbit";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stationsFor } from "@/lib/stations";

export const dynamic = "force-dynamic";

export default async function OrbitaPage() {
  const user = await requireSession();
  const unread = await prisma.alert.count({
    where: { recipientId: user.id, channel: "in_app", readAt: null },
  });
  const stations = stationsFor(user.role).map((station) =>
    station.href === "/alertas" ? { ...station, badge: unread } : station,
  );
  return <Orbit name={user.name} stations={stations} />;
}
