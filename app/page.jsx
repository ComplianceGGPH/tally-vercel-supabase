import Image from "next/image";
import Link from "next/link";
import styles from './styles/Home.module.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 ${styles['bg-section']}`}>
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <Image src="/logo/ggph.png" alt="GGPH Logo" width={500} height={150} className="mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Welcome to GGPH Board</h1>
          <p className="text-muted-foreground text-lg">Manage indemnity forms and participant activities</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/kanban" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <CardTitle>Indemnity Forms</CardTitle>
                </div>
                <CardDescription>
                  View and manage participant indemnity forms by group or activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Access Forms</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/downloadpdf" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <CardTitle>Download PDFs</CardTitle>
                </div>
                <CardDescription>
                  Download and print indemnity forms in PDF format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Download Center</Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}