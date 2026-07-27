import { Shell } from "@/admin/layout/Shell";
import { Button } from "@/admin/ui/button";
import { Link } from "wouter";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <Shell>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-center">404 - Area Restricted</h1>
        <p className="text-muted-foreground text-center max-w-[400px] mb-8">
          The operations dashboard sector you're looking for doesn't exist or you don't have authorization.
        </p>
        <Link href="/admin/dashboard">
          <Button size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </Shell>
  );
}
