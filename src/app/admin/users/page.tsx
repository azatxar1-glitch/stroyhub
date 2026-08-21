import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UserBlockToggle } from "./user-actions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { CUSTOMER: "Заказчик", EXECUTOR: "Исполнитель", ADMIN: "Админ" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { jobs: true, proposals: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Пользователи</h1>
        <p className="mt-1 text-muted">Всего: {users.length}</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Город</th>
              <th className="px-4 py-3 font-medium">Активность</th>
              <th className="px-4 py-3 font-medium">Регистрация</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{u.name}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-foreground">{ROLE_LABEL[u.role] ?? u.role}</td>
                <td className="px-4 py-3 text-muted">{u.city ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {u.role === "CUSTOMER" ? `${u._count.jobs} заявок` : `${u._count.proposals} откликов`}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {u.isBlocked ? <Badge variant="danger">Заблокирован</Badge> : <Badge variant="success">Активен</Badge>}
                </td>
                <td className="px-4 py-3">
                  <UserBlockToggle userId={u.id} isBlocked={u.isBlocked} isAdmin={u.role === "ADMIN"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
