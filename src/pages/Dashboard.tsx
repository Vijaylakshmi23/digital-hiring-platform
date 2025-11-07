import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkerCard } from "@/components/WorkerCard";
import { BookingsList } from "@/components/BookingsList";
import { LogOut, Search, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, []);

  useEffect(() => {
    if (profile?.role === "hirer") {
      loadWorkers();
    }
  }, [profile, searchTerm, selectedCategory]);

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
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const loadWorkers = async () => {
    let query = supabase
      .from("worker_profiles")
      .select(`
        *,
        user:profiles!worker_profiles_user_id_fkey(*),
        category:categories(*)
      `)
      .order("rating", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    const { data } = await query;
    
    let filteredData = data || [];
    
    if (searchTerm) {
      filteredData = filteredData.filter((worker) =>
        worker.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.skills?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setWorkers(filteredData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Digital Hiring Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile?.role === "hirer" ? (
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="browse">
                <Search className="mr-2 h-4 w-4" />
                Browse Workers
              </TabsTrigger>
              <TabsTrigger value="bookings">
                <Calendar className="mr-2 h-4 w-4" />
                My Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-6">Find Workers</h2>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, skills, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workers.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))}
              </div>

              {workers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No workers found matching your criteria</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">My Bookings</h2>
                <p className="text-muted-foreground">
                  Track the status of your work requests
                </p>
              </div>
              <BookingsList userId={user.id} userRole="hirer" />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="bookings">
                <Calendar className="mr-2 h-4 w-4" />
                My Bookings
              </TabsTrigger>
              <TabsTrigger value="profile">
                My Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">My Bookings</h2>
                <p className="text-muted-foreground">
                  Manage your incoming work requests
                </p>
              </div>
              <BookingsList userId={user.id} userRole="worker" />
            </TabsContent>

            <TabsContent value="profile">
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold mb-4">Worker Profile</h2>
                <p className="text-muted-foreground mb-6">
                  Manage your profile and availability
                </p>
                <Button onClick={() => navigate("/worker-profile")}>
                  View My Profile
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
