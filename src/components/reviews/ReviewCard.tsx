import { StarRating } from "@/components/reviews/StarRating";
import { formatReviewDate, REVIEW_STATUS_LABELS, type Review } from "@/types/review";

export function ReviewCard({ review, showStatus }: { review: Review; showStatus?: boolean }) {
  return (
    <article className="rounded-xl border border-border bg-gradient-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating value={review.rating} />
        {showStatus ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {REVIEW_STATUS_LABELS[review.status]}
          </span>
        ) : null}
      </div>
      {review.comment ? (
        <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
      ) : null}
      <footer className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider text-foreground">
          {review.authorName ?? "Verified buyer"}
        </span>
        {review.accountTitle ? <span>· {review.accountTitle}</span> : null}
        {review.createdAt ? <span>· {formatReviewDate(review.createdAt)}</span> : null}
      </footer>
    </article>
  );
}
