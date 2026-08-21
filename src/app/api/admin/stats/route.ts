import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await requireRole(ROLES.ADMIN);

    const [
      totalUsers,
      totalCustomers,
      totalExecutors,
      totalJobs,
      openJobs,
      totalOrders,
      completedOrders,
      totalProposals,
      openComplaints,
      recentUsers,
      recentJobs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: ROLES.CUSTOMER } }),
      prisma.user.count({ where: { role: ROLES.EXECUTOR } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.proposal.count(),
      prisma.complaint.count({ where: { status: "OPEN" } }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalCustomers,
      totalExecutors,
      totalJobs,
      openJobs,
      totalOrders,
      completedOrders,
      totalProposals,
      openComplaints,
      recentUsers,
      recentJobs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
