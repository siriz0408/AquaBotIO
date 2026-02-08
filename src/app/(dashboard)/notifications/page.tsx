"use client";

import Link from "next/link";
import { Bell, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-semibold">Notifications</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-cyan" />
              Notifications
            </CardTitle>
            <CardDescription>
              Stay updated with maintenance reminders and tank alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-brand-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                You&apos;ll see maintenance reminders, water parameter alerts, and
                other important updates here.
              </p>
              <Button asChild variant="outline">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Notification Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
