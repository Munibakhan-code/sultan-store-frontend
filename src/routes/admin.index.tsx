import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  CheckCircle2,
  Coins,
  Hourglass,
  Package,
  PackageCheck,
  PackageX,
  ReceiptText,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatCard } from "@/components/admin/AdminUI";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useAdminStats } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatPrice } from "@/types/store";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data, isLoading, isError, error } = useAdminStats();

  const cards = [
    { label: "Total accounts", value: data?.totalAccounts ?? 0, icon: Package },
    { label: "Available", value: data?.availableAccounts ?? 0, icon: PackageCheck },
    { label: "Sold", value: data?.soldAccounts ?? 0, icon: PackageX },
    { label: "Customers", value: data?.totalCustomers ?? 0, icon: Users },
    { label: "Total orders", value: data?.totalOrders ?? 0, icon: ReceiptText },
    { label: "Pending payments", value: data?.pendingPayments ?? 0, icon: BadgeDollarSign },
    { label: "Pending deals", value: data?.pendingDeals ?? 0, icon: Hourglass },
    { label: "Completed deals", value: data?.completedDeals ?? 0, icon: CheckCircle2 },
    { label: "Revenue", value: formatPrice(data?.revenue ?? 0), icon: Coins },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      description="Live figures served by the backend analytics API."
    >
      {isError ? (
        <ErrorMessage
          className="mb-4"
          message={getApiErrorMessage(error, "Could not load dashboard analytics.")}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            isLoading={isLoading}
          />
        ))}
      </div>
    </AdminLayout>
  );
}
