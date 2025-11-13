import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DirectChat } from "@/components/DirectChat";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { handleSupabaseError } from "@/lib/errorMessages";

const DirectChatPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUser(user);

    // Load other user's profile
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      toast.error(handleSupabaseError(error, "Failed to load user profile"));
      setLoading(false);
      return;
    }

    if (!profileData) {
      toast.error("User not found");
      navigate("/dashboard");
      return;
    }

    setOtherUser(profileData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>User not found</p>
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
        <div className="max-w-4xl mx-auto">
          <DirectChat
            currentUserId={currentUser.id}
            otherUserId={otherUser.id}
            otherUserName={otherUser.full_name}
          />
        </div>
      </main>
    </div>
  );
};

export default DirectChatPage;
