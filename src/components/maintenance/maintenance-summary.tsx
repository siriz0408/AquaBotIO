"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, AlertTriangle, Clock } from "lucide-react";
import type { MaintenanceTask } from "@/types/database";

interface MaintenanceSummaryProps {
  tankId: string;
}

interface MaintenanceSummaryData {
  overdue: number;
  dueToday: number;
  nextTask: MaintenanceTask | null;
}

export function MaintenanceSummary({ tankId }: MaintenanceSummaryProps) {
  const [data, setData] = useState<MaintenanceSummaryData>({
    overdue: 0,
    dueToday: 0,
    nextTask: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch(`/api/tanks/${tankId}/maintenance`);
        const result = await response.json();

        if (result.success && result.data?.tasks) {
          const tasks = result.data.tasks as MaintenanceTask[];
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const overdue = tasks.filter((task) => {
            if (!task.is_active) return false;
            const dueDate = new Date(task.next_due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today;
          }).length;

          const dueToday = tasks.filter((task) => {
            if (!task.is_active) return false;
            const dueDate = new Date(task.next_due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          }).length;

          // Find next upcoming task
          const upcoming = tasks
            .filter((task) => {
              if (!task.is_active) return false;
              const dueDate = new Date(task.next_due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate > today;
            })
            .sort((a, b) => {
              const dateA = new Date(a.next_due_date).getTime();
              const dateB = new Date(b.next_due_date).getTime();
              return dateA - dateB;
            });

          setData({
            overdue,
            dueToday,
            nextTask: upcoming[0] || null,
          });
        }
      } catch (error) {
        console.error("Error loading maintenance summary:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSummary();
  }, [tankId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-brand-cyan" />
            Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = data.overdue > 0 || data.dueToday > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-brand-cyan" />
          Maintenance
        </CardTitle>
        <CardDescription>Upcoming maintenance tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {data.overdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {data.overdue} {data.overdue === 1 ? "overdue" : "overdue"}
            </Badge>
          )}
          {data.dueToday > 0 && (
            <Badge className="bg-yellow-500 text-yellow-950 border-yellow-500 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {data.dueToday} due today
            </Badge>
          )}
          {!hasIssues && (
            <Badge variant="secondary" className="text-xs">
              All caught up
            </Badge>
          )}
        </div>

        {/* Next Task */}
        {data.nextTask && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Next task:</p>
            <p className="font-medium">{data.nextTask.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Due {new Date(data.nextTask.next_due_date).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Link to full page */}
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/tanks/${tankId}/maintenance`}>
            View All Tasks
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
