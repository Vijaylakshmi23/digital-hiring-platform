// src/pages/BookingDetails.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function BookingDetails() {
  const { id } = useParams(); // <-- Extracts :id from route
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setLoading(false);
        setBooking(null);
      } else {
        setBooking(data);
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!booking) return <div>Booking not found.</div>;

  return (
    <div>
      <h2>{booking.work_description}</h2>
      {/* Add more details here as needed */}
    </div>
  );
}
