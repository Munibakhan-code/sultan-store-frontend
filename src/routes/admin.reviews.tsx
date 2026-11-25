import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EyeOff, Star, Trash2, Upload } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataState, Panel, Pill, Select, Td, Th, TableWrap } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { StarRating } from "@/components/reviews/StarRating";
import { notify } from "@/components/common/Toast";
import { useAdminReviews, useDeleteReview, useSetReviewStatus } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";
import { REVIEW_STATUS_LABELS, formatReviewDate, type ReviewStatus } from "@/types/review";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviewsPage,
});

const FILTERS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "private", label: "Private" },
  { value: "all", label: "All" },
];

function AdminReviewsPage() {
  const [status, setStatus] = useState("pending");
  const { data, isLoading, isError, error } = useAdminReviews(status);
  const setReviewStatus = useSetReviewStatus();
  const remove = useDeleteReview();

  const reviews = data ?? [];

  async function changeStatus(id: string, next: ReviewStatus) {
    try {
      await setReviewStatus.mutateAsync({ id, status: next });
      notify.success(`Review ${next === "published" ? "published" : "set to private"}`);
    } catch (err) {
      notify.error("Update failed", getApiErrorMessage(err, "Could not update this review."));
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id);
      notify.success("Review deleted");
    } catch (err) {
      notify.error("Delete failed", getApiErrorMessage(err, "Could not delete this review."));
    }
  }

  return (
    <AdminLayout
      title="Reviews"
      description="Only you can publish a review — customers never change their own status."
      actions={
        <div className="w-40">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Review filter">
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      }
    >
      <Panel title={`${reviews.length} review(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={reviews.length === 0}
          emptyTitle="No reviews here"
          emptyDescription="Reviews from completed deals will show up in this list."
          emptyIcon={<Star className="h-6 w-6" />}
          errorFallback="Could not load reviews."
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Author</Th>
                <Th>Rating</Th>
                <Th>Comment</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold">{review.authorName ?? "Customer"}</span>
                      <span className="text-xs text-muted-foreground">
                        {review.accountTitle ?? ""} {formatReviewDate(review.createdAt)}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <StarRating value={review.rating} />
                  </Td>
                  <Td className="max-w-[18rem] text-muted-foreground">{review.comment ?? "—"}</Td>
                  <Td>
                    <Pill
                      tone={
                        review.status === "published"
                          ? "success"
                          : review.status === "private"
                            ? "muted"
                            : "primary"
                      }
                    >
                      {REVIEW_STATUS_LABELS[review.status]}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {review.status !== "published" ? (
                        <Button
                          size="sm"
                          onClick={() => changeStatus(review.id, "published")}
                          isLoading={setReviewStatus.isPending}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Publish
                        </Button>
                      ) : null}
                      {review.status !== "private" ? (
                        <Button
                          size="sm"
                          variant="surface"
                          onClick={() => changeStatus(review.id, "private")}
                          isLoading={setReviewStatus.isPending}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Make private
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(review.id)}
                        isLoading={remove.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataState>
      </Panel>
    </AdminLayout>
  );
}
