import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";

export default function Delivery() {
  return (
    <Shell>
      <div className="flex flex-col gap-8 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Delivery & Branch Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Branch management has been removed. This is a single-location business.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <span className="text-primary underline cursor-pointer">
              ← Back to Dashboard
            </span>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
