import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookingSchema } from "@/lib/validationSchemas";
import { handleSupabaseError } from "@/lib/errorMessages";

const Booking = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date>();
  const [formData, setFormData] = useState({
    startTime: "",
    durationHours: "",
    workDescription: "",
  });

  useEffect(() => {
    loadWorkerData();
  }, [workerId]);

  const loadWorkerData = async () => {
    const { data } = await supabase
      .from("worker_profiles")
      .select(`
        *,
        user:profiles!worker_profiles_user_id_fkey(*),
        category:categories(*)
      `)
      .eq("id", workerId)
      .single();

    setWorker(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingDate) {
      toast.error("Please select a booking date");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/auth");
        setLoading(false);
        return;
      }

      const validationResult = bookingSchema.safeParse({
        bookingDate,
        startTime: formData.startTime || '',
        durationHours: formData.durationHours ? Number(formData.durationHours) : 0,
        workDescription: formData.workDescription,
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      const agreedRate = validationResult.data.durationHours 
        ? validationResult.data.durationHours * worker.hourly_rate
        : worker.daily_rate || worker.hourly_rate * 8;

      const { error } = await supabase.from("bookings").insert({
        hirer_id: user.id,
        worker_id: workerId,
        booking_date: format(validationResult.data.bookingDate, "yyyy-MM-dd"),
        start_time: validationResult.data.startTime || null,
        duration_hours: validationResult.data.durationHours || null,
        work_description: validationResult.data.workDescription,
        agreed_rate: agreedRate,
        status: "pending",
      });

      if (error) {
        toast.error(handleSupabaseError(error, "Failed to create booking"));
        setLoading(false);
        return;
      }

      toast.success("Booking request submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const estimatedCost = formData.durationHours
    ? parseFloat(formData.durationHours) * worker.hourly_rate
    : worker.daily_rate || worker.hourly_rate * 8;

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
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-card">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Book {worker.user.full_name}</h1>
              <p className="text-muted-foreground">
                {worker.category?.name} • ₹{worker.hourly_rate}/hour
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Booking Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !bookingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bookingDate ? format(bookingDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.5"
                  placeholder="8"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty for full day booking
                </p>
              </div>

              <div>
                <Label htmlFor="description">Work Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work you need done..."
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Estimated Cost:</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{estimatedCost.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Final payment after work completion
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Booking Request
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Booking;
