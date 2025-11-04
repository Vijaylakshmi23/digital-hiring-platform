import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, HardHat, CheckCircle, Users, Shield, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Wide Range of Skills",
      description: "Find skilled workers across 8+ categories from plumbers to chefs"
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "All workers go through verification with ratings and reviews"
    },
    {
      icon: Clock,
      title: "Real-Time Availability",
      description: "Check worker availability with our calendar system"
    },
    {
      icon: CheckCircle,
      title: "Secure Payments",
      description: "Pay after work completion with integrated payment system"
    }
  ];

  const categories = [
    "Plumber", "Carpenter", "Painter", "Electrician", 
    "Chef", "Cleaner", "Gardener", "Mason"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Digital Hiring Platform
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Connect with skilled daily wage workers or find your next opportunity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              I Need Workers
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 bg-white/10 hover:bg-white/20 text-white border-white"
            >
              <HardHat className="mr-2 h-5 w-5" />
              I'm Looking for Work
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Available Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((category, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
                <p className="font-medium">{category}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero text-primary-foreground py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of workers and hirers on our platform
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Sign Up Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Digital Hiring Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
