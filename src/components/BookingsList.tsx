import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { handleSupabaseError } from "@/lib/errorMessages";
import { toast } from "sonner";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface BookingsListProps {
  userId: string;
  userRole: "hirer" | "worker";
}

export const BookingsList = ({ userId, userRole }: BookingsListProps) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCounts = useUnreadMessages(userId);

  useEffect(() => {
    loadBookings();
  }, [userId, userRole]);

  const loadBookings = async () => {
    try {
      let query = supabase
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
        .order("created_at", { ascending: false });

      if (userRole === "hirer") {
        query = query.eq("hirer_id", userId);
      } else {
        // For workers, filter by their worker_profile id
        const { data: workerProfile } = await supabase
          .from("worker_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (workerProfile) {
          query = query.eq("worker_id", workerProfile.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error(handleSupabaseError(error, "Failed to load bookings"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "confirmed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return userRole === "hirer" ? "Awaiting Worker Response" : "Action Required";
      case "confirmed":
        return "Accepted";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Declined";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          {userRole === "hirer" 
            ? "You haven't made any bookings yet. Browse workers to get started!"
            : "You haven't received any bookings yet."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    {userRole === "hirer" 
                      ? booking.worker.user.full_name 
                      : booking.hirer.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.worker.category.name}
                  </p>
                </div>
                <Badge variant={getStatusColor(booking.status)}>
                  {getStatusLabel(booking.status)}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {booking.work_description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(booking.booking_date), "MMM d, yyyy")}</span>
                </div>
                {booking.start_time && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{booking.start_time}</span>
                  </div>
                )}
                <div className="font-semibold text-success">
                  ₹{booking.agreed_rate}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/booking/${booking.id}`)}
                className="w-full md:w-auto"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              {booking.status === "confirmed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const otherUserId = userRole === "hirer" 
                      ? booking.worker.user_id 
                      : booking.hirer_id;
                    navigate(`/chat/${otherUserId}`);
                  }}
                  className="w-full md:w-auto relative"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat
                  {(() => {
                    const otherUserId = userRole === "hirer" 
                      ? booking.worker.user_id 
                      : booking.hirer_id;
                    const count = unreadCounts[otherUserId];
                    return count > 0 ? (
                      <Badge 
                        variant="destructive" 
                        className="ml-2 h-5 min-w-5 px-1 text-xs"
                      >
                        {count}
                      </Badge>
                    ) : null;
                  })()}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
