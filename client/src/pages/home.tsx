import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-500" />
            <CardTitle className="text-3xl">Welcome to Your Full-Stack App</CardTitle>
          </div>
          <CardDescription className="text-lg">
            React + Express + Discord Bot - All configured and ready to use!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Your application is successfully running on Replit with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>React frontend with Vite and TypeScript</li>
              <li>Express backend with proper API setup</li>
              <li>Discord.js bot integration</li>
              <li>PostgreSQL database with Drizzle ORM</li>
              <li>Tailwind CSS with Radix UI components</li>
            </ul>
            <div className="flex items-center gap-2 mt-6">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-sm text-gray-600">Built with love for Replit</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}