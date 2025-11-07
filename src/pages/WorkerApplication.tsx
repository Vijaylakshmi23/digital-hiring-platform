import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { workerApplicationSchema } from "@/lib/validationSchemas";
import { handleSupabaseError } from "@/lib/errorMessages";

const WorkerApplication = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    hourlyRate: "",
    dailyRate: "",
    experienceYears: "",
    skills: "",
    bio: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/auth");
        setLoading(false);
        return;
      }

      const validationResult = workerApplicationSchema.safeParse({
        categoryId: formData.categoryId,
        hourlyRate: Number(formData.hourlyRate),
        dailyRate: formData.dailyRate ? Number(formData.dailyRate) : 0,
        experienceYears: Number(formData.experienceYears),
        skills: formData.skills,
        bio: formData.bio || '',
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("worker_profiles").insert({
        user_id: user.id,
        category_id: validationResult.data.categoryId,
        hourly_rate: validationResult.data.hourlyRate,
        daily_rate: validationResult.data.dailyRate || null,
        experience_years: validationResult.data.experienceYears,
        skills: validationResult.data.skills,
        bio: validationResult.data.bio || null,
      });

      if (error) {
        toast.error(handleSupabaseError(error, "Failed to submit application"));
        setLoading(false);
        return;
      }

      toast.success("Application submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 shadow-card">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Worker Application</h1>
            <p className="text-muted-foreground">Tell us about your skills and experience</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your profession" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dailyRate">Daily Rate ($)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  placeholder="200.00"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="experience">Years of Experience *</Label>
              <Input
                id="experience"
                type="number"
                placeholder="5"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma separated) *</Label>
              <Input
                id="skills"
                type="text"
                placeholder="Plumbing, Pipe Fitting, Leak Repair"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio / Description</Label>
              <Textarea
                id="bio"
                placeholder="Tell hirers about your experience and what makes you great at your job..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Application
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default WorkerApplication;
