import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Phone, DollarSign, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WorkerCardProps {
  worker: any;
}

const RupeeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <text
      x="2"
      y="13"
      fontFamily="Arial, sans-serif"
      fontSize="14"
      fontWeight="bold"
      fill="currentColor"
    >
      ₹
    </text>
  </svg>
);

export const WorkerCard = ({ worker }: WorkerCardProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 bg-gradient-card">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {getInitials(worker.user.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">{worker.user.full_name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Badge variant="secondary">{worker.category?.name}</Badge>
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-warning text-warning mr-1" />
              <span className="font-medium">{worker.rating || "New"}</span>
            </div>
          </div>
        </div>
      </div>

      {worker.bio && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{worker.bio}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-success">₹</span>
          {worker.hourly_rate && <span>₹{worker.hourly_rate}/hr</span>}
          {worker.daily_rate && <span>₹{worker.daily_rate}/day</span>}
        </div>
        
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-2">Contact Information</h4>
          <div className="space-y-2">
            {worker.user.phone ? (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>{worker.user.phone}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Phone not provided</div>
            )}
            {worker.user.email ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">📧</span>
                <span>{worker.user.email}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Email not provided</div>
            )}
          </div>
        </div>

        {worker.experience_years && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{worker.experience_years} years experience</span>
          </div>
        )}
      </div>

      {worker.skills && worker.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {worker.skills.slice(0, 3).map((skill: string, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {worker.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{worker.skills.length - 3} more
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          onClick={() => navigate(`/worker/${worker.id}`)}
        >
          View Profile
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/booking/${worker.id}`)}
        >
          Book Now
        </Button>
      </div>
    </Card>
  );
};
