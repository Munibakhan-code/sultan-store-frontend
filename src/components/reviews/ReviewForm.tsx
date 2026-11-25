import * as React from "react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { StarPicker } from "@/components/reviews/StarRating";
import { useCreateReview } from "@/hooks/useReviews";
import { notify } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/services/apiClient";

/**
 * Customers submit rating + comment only. Visibility (pending/published/private)
 * is decided by an admin on the backend.
 */
export function ReviewForm({ orderId, onDone }: { orderId: string; onDone?: () => void }) {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const create = useCreateReview();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError("Please pick a rating between 1 and 5.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Tell us a little more — at least 10 characters.");
      return;
    }
    create.mutate(
      { orderId, rating, comment: comment.trim() },
      {
        onSuccess: () => {
          notify.success("Review submitted", "Our team will review it before publishing.");
          setComment("");
          onDone?.();
        },
        onError: (err) => setError(getApiErrorMessage(err, "Could not submit your review.")),
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your rating
        </p>
        <div className="mt-2">
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`review-comment-${orderId}`}
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Your review
        </label>
        <textarea
          id={`review-comment-${orderId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={800}
          placeholder="How was the account and the handover process?"
          className="w-full resize-y rounded-md border border-input bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <ErrorMessage message={error} />

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" isLoading={create.isPending}>
          Submit review
        </Button>
        <p className="text-xs text-muted-foreground">
          Reviews are published only after admin approval.
        </p>
      </div>
    </form>
  );
}
