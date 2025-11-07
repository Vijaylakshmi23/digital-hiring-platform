import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, MapPin, Phone, DollarSign, Briefcase, Calendar as CalendarIcon, Bell } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { handleSupabaseError } from "@/lib/errorMessages";

const WorkerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availabilityStatus, setAvailabilityStatus] = useState("available");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (workerProfile && selectedDate) {
      loadAvailability();
    }
  }, [selectedDate, workerProfile]);

  useEffect(() => {
    if (workerProfile) {
      loadBookings();
    }
  }, [workerProfile]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);

    if (profileData?.role === "worker") {
      const { data: workerData } = await supabase
        .from("worker_profiles")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("user_id", session.user.id)
        .single();

      setWorkerProfile(workerData);
    }
    
    setLoading(false);
  };

  const loadAvailability = async () => {
    if (!selectedDate || !workerProfile) return;

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const { data } = await supabase
      .from("availability_calendar")
      .select("*")
      .eq("worker_id", workerProfile.id)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"));

    setAvailability(data || []);
  };

  const loadBookings = async () => {
    if (!workerProfile) return;

    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        hirer:profiles!bookings_hirer_id_fkey(*)
      `)
      .eq("worker_id", workerProfile.id)
      .order("booking_date", { ascending: false });

    setBookings(data || []);
  };

  const handleSetAvailability = async (date: Date) => {
    if (!workerProfile) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const existing = availability.find((a) => a.date === dateStr);

    if (existing) {
      const { error } = await supabase
        .from("availability_calendar")
        .update({ status: availabilityStatus })
        .eq("id", existing.id);

      if (error) {
        toast.error(handleSupabaseError(error, "Failed to update availability"));
        return;
      }
    } else {
      const { error } = await supabase
        .from("availability_calendar")
        .insert({
          worker_id: workerProfile.id,
          date: dateStr,
          status: availabilityStatus,
        });

      if (error) {
        toast.error(handleSupabaseError(error, "Failed to set availability"));
        return;
      }
    }

    toast.success("Availability updated");
    loadAvailability();
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availability.find((a) => a.date === dateStr);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getBookingStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Worker Profile Found</h2>
          <p className="text-muted-foreground mb-6">
            You need to create a worker profile first.
          </p>
          <Button onClick={() => navigate("/worker-application")}>
            Create Worker Profile
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Worker Profile Info */}
          <div className="lg:col-span-2">
            <Card className="p-8 shadow-card mb-6">
              <div className="flex items-start gap-6 mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {workerProfile.category?.name}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-warning text-warning mr-1" />
                      <span className="font-semibold text-lg">{workerProfile.rating || "New"}</span>
                    </div>
                    {workerProfile.total_jobs > 0 && (
                      <span className="text-muted-foreground">
                        {workerProfile.total_jobs} jobs completed
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-base">
                      <DollarSign className="h-5 w-5 text-success" />
                      <span className="font-medium">
                        ₹{workerProfile.hourly_rate}/hour
                        {workerProfile.daily_rate && ` • ₹${workerProfile.daily_rate}/day`}
                      </span>
                    </div>
                    {workerProfile.experience_years && (
                      <div className="flex items-center gap-2 text-base">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <span>{workerProfile.experience_years} years of experience</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {workerProfile.bio && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{workerProfile.bio}</p>
                </div>
              )}

              {workerProfile.skills && workerProfile.skills.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {workerProfile.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-base">{profile.phone}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-destructive" />
                    <span className="text-base">{profile.address}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Bookings Section */}
            <Card className="p-6 shadow-card">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-6 w-6" />
                My Bookings
              </h2>
              
              {bookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No bookings yet
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{booking.hirer.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.booking_date), "PPP")}
                            {booking.start_time && ` at ${booking.start_time}`}
                          </p>
                        </div>
                        {getBookingStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm mb-2">{booking.work_description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {booking.duration_hours ? `${booking.duration_hours} hours` : "Full day"}
                        </span>
                        <span className="font-semibold text-success">
                          ₹{booking.agreed_rate}
                        </span>
                      </div>
                      <Button 
                        onClick={() => navigate(`/booking-detail/${booking.id}`)}
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        View Details
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Availability Calendar */}
          <div className="lg:col-span-1">
            <Card className="p-6 shadow-card sticky top-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Manage Availability
              </h2>
              
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Set Status</label>
                <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Not Available</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date) handleSetAvailability(date);
                }}
                className="rounded-md border"
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

              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium">Click a date to set availability</p>
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
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerProfile;
