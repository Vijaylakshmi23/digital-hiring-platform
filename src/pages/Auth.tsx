import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Briefcase, HardHat } from "lucide-react";
import { signUpSchema, loginSchema } from "@/lib/validationSchemas";
import { handleSupabaseError } from "@/lib/errorMessages";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"hirer" | "worker">("hirer");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const validationResult = loginSchema.safeParse({ 
          email: formData.email, 
          password: formData.password 
        });
        
        if (!validationResult.success) {
          toast.error(validationResult.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: validationResult.data.email,
          password: validationResult.data.password,
        });

        if (error) {
          toast.error(handleSupabaseError(error));
          setLoading(false);
          return;
        }

        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const validationResult = signUpSchema.safeParse({ 
          email: formData.email, 
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone || '',
          role: role
        });
        
        if (!validationResult.success) {
          toast.error(validationResult.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: validationResult.data.email,
          password: validationResult.data.password,
          options: {
            data: {
              full_name: validationResult.data.fullName,
              role: validationResult.data.role,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          toast.error(handleSupabaseError(error, "Failed to create account"));
          setLoading(false);
          return;
        }

        toast.success("Account created successfully!");
        
        if (role === "worker") {
          navigate("/worker-application");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Digital Hiring Platform</h1>
          <p className="text-muted-foreground">Connect with skilled workers or find your next job</p>
        </div>

        <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <form onSubmit={handleAuth}>
            <TabsContent value="login" className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Login
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div>
                <Label>I want to</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as "hirer" | "worker")} className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <RadioGroupItem value="hirer" id="hirer" className="peer sr-only" />
                    <Label
                      htmlFor="hirer"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Briefcase className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium">Hire Workers</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="worker" id="worker" className="peer sr-only" />
                    <Label
                      htmlFor="worker"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <HardHat className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium">Find Work</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="signup-phone">Phone Number</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </TabsContent>
          </form>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
