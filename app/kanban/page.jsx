import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Home } from 'lucide-react';

export default function Kanban() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Logo Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 items-center justify-items-center">
            {[
              { src: "/logo/ggp.png", name: "GGP" },
              { src: "/logo/gct.png", name: "GCT" },
              { src: "/logo/pwap.png", name: "PWAP" },
              { src: "/logo/lrc.png", name: "LRC" },
              { src: "/logo/botani.png", name: "Botani" },
              { src: "/logo/glow.png", name: "GLOW" },
            ].map((logo, index) => (
              <div key={index} className="grayscale hover:grayscale-0 transition-all">
                <Image src={logo.src} alt={logo.name} width={100} height={80} className="object-contain" />
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Indemnity Form Management</h1>
          <p className="text-muted-foreground text-lg">Choose how you'd like to view and manage forms</p>
        </div>
        
        {/* Selection Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/kanban/grp" className="block">
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Group Selection</CardTitle>
                    <CardDescription className="mt-1">
                      Browse participants organized by their assigned groups
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• View all groups</li>
                  <li>• Filter by branch and date</li>
                  <li>• See participant details by group</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link href="/kanban/act" className="block">
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Activity Selection</CardTitle>
                    <CardDescription className="mt-1">
                      Browse participants organized by scheduled activities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• View activities by date</li>
                  <li>• Filter by branch and time</li>
                  <li>• Manage activity participants</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Home Link */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}