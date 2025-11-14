import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingMessages } from "@/components/BookingMessages";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
import { ArrowLeft, Calendar, Clock, DollarSign, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { handleSupabaseError } from "@/lib/errorMessages";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const BookingDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const unreadCounts = useUnreadMessages(currentUser?.id);

  useEffect(() => {
    loadData();
  }, [bookingId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUser(user);

    const { data: bookingData, error } = await supabase
      .from("bookings")
      .select(`
        *,
        worker:worker_profiles!bookings_worker_id_fkey(
          *,
          user:profiles!worker_profiles_user_id_fkey(*),
          category:categories(*)
        ),
        hirer:profiles!bookings_hirer_id_fkey(*)
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (error) {
      toast.error(handleSupabaseError(error, "Failed to load booking details"));
      setLoading(false);
      return;
    }

    setBooking(bookingData);

    // Check if review exists
    if (bookingData?.status === "completed" && bookingData.hirer_id === user.id) {
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();
      
      setExistingReview(reviewData);
    }

    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast.error(handleSupabaseError(error, "Failed to update booking status"));
    } else {
      const statusMessage = newStatus === "confirmed" ? "accepted" : 
                           newStatus === "completed" ? "completed" : "updated";
      toast.success(`Booking ${statusMessage}`);
      
      // Show notification when worker completes the booking
      if (newStatus === "completed") {
        toast.info("Work completed! The hirer can now leave a review.", {
          duration: 5000,
        });
      }
      
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Booking not found</p>
      </div>
    );
  }

  const isHirer = currentUser?.id === booking.hirer_id;
  const canReview = isHirer && booking.status === "completed" && !existingReview;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Booking Details</h1>
                <Badge variant={
                  booking.status === "completed" ? "default" :
                  booking.status === "confirmed" ? "secondary" :
                  booking.status === "cancelled" ? "destructive" : "outline"
                }>
                  {booking.status}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Worker</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/chat/${booking.worker.user_id}`)}
                      className="relative"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Direct Chat
                      {unreadCounts[booking.worker.user_id] > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 h-5 min-w-5 px-1 text-xs"
                        >
                          {unreadCounts[booking.worker.user_id]}
                        </Badge>
                      )}
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{booking.worker.user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.worker.category.name}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Work Description</h3>
                  <p className="text-muted-foreground">{booking.work_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Date</span>
                    </div>
                    <p className="text-muted-foreground">
                      {format(new Date(booking.booking_date), "MMM d, yyyy")}
                    </p>
                  </div>

                  {booking.start_time && (
                    <div>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">Time</span>
                      </div>
                      <p className="text-muted-foreground">{booking.start_time}</p>
                    </div>
                  )}

                  {booking.duration_hours && (
                    <div>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">Duration</span>
                      </div>
                      <p className="text-muted-foreground">{booking.duration_hours} hours</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="font-medium">Total Cost</span>
                    </div>
                    <p className="text-lg font-bold text-success">₹{booking.agreed_rate}</p>
                  </div>
                </div>

                {booking.status === "pending" && !isHirer && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleStatusUpdate("confirmed")}
                      className="flex-1"
                    >
                      Accept Booking
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate("cancelled")}
                      variant="destructive"
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {booking.status === "confirmed" && !isHirer && (
                  <Button
                    onClick={() => handleStatusUpdate("completed")}
                    className="w-full"
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </Card>

            <BookingMessages
              bookingId={bookingId!}
              currentUserId={currentUser.id}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {canReview && (
              <ReviewForm
                bookingId={bookingId!}
                workerId={booking.worker_id}
                hirerId={currentUser.id}
                onReviewSubmitted={loadData}
              />
            )}
            {existingReview && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Your Review</h3>
                <p className="text-sm text-muted-foreground">
                  You've already reviewed this booking. Thank you for your feedback!
                </p>
              </Card>
            )}
            
            <ReviewsList workerId={booking.worker_id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingDetail;