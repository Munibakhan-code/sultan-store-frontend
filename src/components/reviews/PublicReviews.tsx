import { Star } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { usePublicReviews } from "@/hooks/useReviews";
import { getApiErrorMessage } from "@/services/apiClient";

/** Published-only reviews, safe for the public home page. */
export function PublicReviews() {
  const { data: reviews, isLoading, isError, error } = usePublicReviews();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message={getApiErrorMessage(error, "Could not load reviews.")} />;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4 text-primary" /> Buyer reviews appear here once published.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {reviews.slice(0, 6).map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
