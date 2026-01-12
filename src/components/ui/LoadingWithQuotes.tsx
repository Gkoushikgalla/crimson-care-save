import { useBloodDonationQuotes } from "@/hooks/useBloodDonationQuotes";
import { Heart, Loader2 } from "lucide-react";

interface LoadingWithQuotesProps {
  message?: string;
  showHeart?: boolean;
}

const LoadingWithQuotes = ({ message = "Loading...", showHeart = true }: LoadingWithQuotesProps) => {
  const { currentQuote } = useBloodDonationQuotes(4000);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center animate-fade-in">
      {/* Spinner */}
      <div className="relative">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        {showHeart && (
          <Heart className="absolute inset-0 m-auto h-5 w-5 text-primary fill-primary animate-pulse" />
        )}
      </div>

      {/* Message */}
      <p className="text-lg font-medium text-foreground">{message}</p>

      {/* Quote */}
      <div className="max-w-md">
        <p className="text-sm text-muted-foreground italic transition-opacity duration-500">
          "{currentQuote}"
        </p>
      </div>
    </div>
  );
};

export default LoadingWithQuotes;
