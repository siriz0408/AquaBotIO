"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Fish, ArrowLeft, Loader2, Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TaskCard } from "@/components/maintenance/task-card";
import { CreateTaskModal } from "@/components/maintenance/create-task-modal";
import { CompleteTaskModal } from "@/components/maintenance/complete-task-modal";
import type { MaintenanceTask, MaintenanceLog } from "@/types/database";

interface Tank {
  id: string;
  name: string;
}

export default function MaintenancePage() {
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;
  const supabase = createClient();

  const [tank, setTank] = useState<Tank | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [taskLogs, setTaskLogs] = useState<Record<string, MaintenanceLog[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/tanks/${tankId}/maintenance`);
      const data = await response.json();

      if (data.success && data.data?.tasks) {
        const loadedTasks = data.data.tasks as MaintenanceTask[];
        setTasks(loadedTasks);

        // Load logs for each task
        const logsMap: Record<string, MaintenanceLog[]> = {};
        for (const task of loadedTasks) {
          try {
            const logResponse = await fetch(
              `/api/tanks/${tankId}/maintenance/${task.id}`
            );
            const logData = await logResponse.json();
            if (logData.success && logData.data?.logs) {
              logsMap[task.id] = logData.data.logs as MaintenanceLog[];
            }
          } catch (error) {
            console.error(`Error loading logs for task ${task.id}:`, error);
          }
        }
        setTaskLogs(logsMap);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load maintenance tasks");
    } finally {
      setIsLoading(false);
    }
  }, [tankId]);

  // Load tank info
  useEffect(() => {
    async function loadTankData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: tankData, error: tankError } = await supabase
          .from("tanks")
          .select("id, name")
          .eq("id", tankId)
          .eq("user_id", user.id)
          .single();

        if (tankError || !tankData) {
          toast.error("Tank not found");
          router.push("/dashboard");
          return;
        }

        setTank(tankData);
        loadTasks();
      } catch (error) {
        console.error("Error loading tank data:", error);
        toast.error("Failed to load tank data");
        setIsLoading(false);
      }
    }

    loadTankData();
  }, [supabase, tankId, router, loadTasks]);

  const handleTaskCreated = () => {
    loadTasks();
  };

  const handleTaskCompleted = () => {
    loadTasks();
  };

  const handleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setCompletingTaskId(taskId);
    }
  };

  const handleEdit = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsCreateModalOpen(true);
  };

  const _handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tanks/${tankId}/maintenance/${taskId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Task deleted");
        loadTasks();
      } else {
        toast.error(data.error?.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!tank) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueOrOverdue = tasks.filter((task) => {
    if (!task.is_active) return false;
    const dueDate = new Date(task.next_due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  }).sort((a, b) => {
    const dateA = new Date(a.next_due_date).getTime();
    const dateB = new Date(b.next_due_date).getTime();
    return dateA - dateB; // Most overdue first
  });

  const upcoming = tasks.filter((task) => {
    if (!task.is_active) return false;
    const dueDate = new Date(task.next_due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > today;
  }).sort((a, b) => {
    const dateA = new Date(a.next_due_date).getTime();
    const dateB = new Date(b.next_due_date).getTime();
    return dateA - dateB; // Soonest first
  });

  const completingTask = completingTaskId
    ? tasks.find((t) => t.id === completingTaskId)
    : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tanks/${tankId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-bold">AquaBotAI</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Maintenance Schedule
            </h1>
            <p className="text-muted-foreground">{tank.name}</p>
          </div>
          <Button onClick={() => {
            setEditingTask(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Due / Overdue Section */}
        {dueOrOverdue.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-red-500" />
              Due / Overdue
            </h2>
            <div className="space-y-3">
              {dueOrOverdue.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  logs={taskLogs[task.id] || []}
                  onComplete={handleComplete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  logs={taskLogs[task.id] || []}
                  onComplete={handleComplete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {dueOrOverdue.length === 0
                    ? "No maintenance tasks yet. Add your first task to stay on top of your tank care."
                    : "No upcoming tasks"}
                </p>
                {dueOrOverdue.length === 0 && (
                  <Button onClick={() => {
                    setEditingTask(null);
                    setIsCreateModalOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Task
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        tankId={tankId}
        task={editingTask}
        onSuccess={handleTaskCreated}
      />

      {completingTask && (
        <CompleteTaskModal
          isOpen={!!completingTaskId}
          onClose={() => setCompletingTaskId(null)}
          task={completingTask}
          onSuccess={handleTaskCompleted}
        />
      )}
    </div>
  );
}
