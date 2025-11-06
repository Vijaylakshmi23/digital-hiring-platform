import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  hirer: {
    full_name: string;
  };
}

interface ReviewsListProps {
  workerId: string;
}

export const ReviewsList = ({ workerId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    loadReviews();
  }, [workerId]);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading reviews:", error);
      setLoading(false);
      return;
    }

    // Fetch hirer info for each review
    if (data && data.length > 0) {
      const hirerIds = [...new Set(data.map(r => r.hirer_id))];
      const { data: hirersData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", hirerIds);

      const hirersMap = new Map(hirersData?.map(h => [h.id, h]) || []);
      const reviewsWithHirers = data.map(review => ({
        ...review,
        hirer: hirersMap.get(review.hirer_id) || { full_name: "Unknown User" }
      }));

      setReviews(reviewsWithHirers);
      
      // Calculate average rating
      const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
      setAverageRating(Number(avg.toFixed(1)));
    }
    
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Reviews & Ratings</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-5 w-5 fill-warning text-warning mr-1" />
              <span className="text-2xl font-bold">{averageRating}</span>
            </div>
            <span className="text-muted-foreground">
              ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reviews yet. Be the first to leave a review!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(review.hirer.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{review.hirer.full_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground">{review.review_text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};