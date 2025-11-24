import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { handleSupabaseError } from "@/lib/errorMessages";

interface ReviewFormProps {
  bookingId: string;
  workerId: string;
  hirerId: string;
  onReviewSubmitted: () => void;
}

export const ReviewForm = ({ bookingId, workerId, hirerId, onReviewSubmitted }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("reviews")
      .insert({
        booking_id: bookingId,
        worker_id: workerId,
        hirer_id: hirerId,
        rating,
        review_text: reviewText.trim() || null
      });

    if (error) {
      toast.error(handleSupabaseError(error, "Failed to submit review"));
    } else {
      toast.success("Review submitted successfully!");
      onReviewSubmitted();
    }
    setLoading(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Leave a Review</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
              Rate the Worker
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Review (Optional)</label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this worker..."
          className="min-h-[120px]"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {reviewText.length}/1000 characters
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || loading}
        className="w-full"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </Card>
  );
};
