import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { ReviewsList } from "@/components/ReviewsList";
import { ArrowLeft, Star, MapPin, Phone, DollarSign, Briefcase, Calendar as CalendarIcon, MessageCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const WorkerDetail = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkerData();
  }, [workerId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailability();
    }
  }, [selectedDate, workerId]);

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
    setLoading(false);
  };

  const loadAvailability = async () => {
    if (!selectedDate) return;

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const { data } = await supabase
      .from("availability_calendar")
      .select("*")
      .eq("worker_id", workerId)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"));

    setAvailability(data || []);
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availability.find((a) => a.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success";
      case "unavailable":
        return "bg-destructive";
      case "holiday":
        return "bg-warning";
      default:
        return "bg-muted";
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Worker not found</p>
      </div>
    );
  }

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
          {/* Worker Profile */}
          <div className="lg:col-span-2">
            <Card className="p-8 shadow-card">
              <div className="flex items-start gap-6 mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(worker.user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{worker.user.full_name}</h1>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {worker.category?.name}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-warning text-warning mr-1" />
                      <span className="font-semibold text-lg">{worker.rating || "New"}</span>
                    </div>
                    {worker.total_jobs > 0 && (
                      <span className="text-muted-foreground">
                        {worker.total_jobs} jobs completed
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-base">
                      <DollarSign className="h-5 w-5 text-success" />
                      <span className="font-medium">
                        ₹{worker.hourly_rate}/hour
                        {worker.daily_rate && ` • ₹${worker.daily_rate}/day`}
                      </span>
                    </div>
                    {worker.experience_years && (
                      <div className="flex items-center gap-2 text-base">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <span>{worker.experience_years} years of experience</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {worker.bio && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{worker.bio}</p>
                </div>
              )}

              {worker.skills && worker.skills.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
                {worker.user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-base">{worker.user.phone}</span>
                  </div>
                )}
                {worker.user.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-destructive" />
                    <span className="text-base">{worker.user.address}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Reviews Section */}
            <ReviewsList workerId={workerId!} />
          </div>

          {/* Availability Calendar */}
          <div className="lg:col-span-1">
            <Card className="p-6 shadow-card sticky top-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Availability
              </h2>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  available: (date) => {
                    const avail = getAvailabilityForDate(date);
                    return avail?.status === "available";
                  },
                  unavailable: (date) => {
                    const avail = getAvailabilityForDate(date);
                    return avail?.status === "unavailable";
                  },
                  holiday: (date) => {
                    const avail = getAvailabilityForDate(date);
                    return avail?.status === "holiday";
                  },
                }}
                modifiersStyles={{
                  available: { backgroundColor: "hsl(var(--success))", color: "white" },
                  unavailable: { backgroundColor: "hsl(var(--destructive))", color: "white" },
                  holiday: { backgroundColor: "hsl(var(--warning))", color: "white" },
                }}
              />

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive"></div>
                  <span>Not Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning"></div>
                  <span>Holiday</span>
                </div>
              </div>

              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={() => navigate(`/booking/${workerId}`)}
              >
                Book Now
              </Button>
              
              <Button 
                className="w-full mt-3" 
                size="lg"
                variant="outline"
                onClick={() => navigate(`/chat/${worker.user_id}`)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Direct Chat
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDetail;
