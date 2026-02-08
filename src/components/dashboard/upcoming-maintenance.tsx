"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MaintenanceTask {
  id: string;
  title: string;
  due: string;
  completed: boolean;
}

interface UpcomingMaintenanceProps {
  tasks?: MaintenanceTask[];
  tankId?: string;
  className?: string;
  onToggleTask?: (taskId: string) => void;
}

const defaultTasks: MaintenanceTask[] = [
  { id: "1", title: "Water change (20%)", due: "Due Saturday", completed: false },
  { id: "2", title: "Dose calcium", due: "Due tomorrow", completed: false },
  { id: "3", title: "Clean filter media", due: "Due in 5 days", completed: false },
];

export function UpcomingMaintenance({
  tasks: initialTasks = defaultTasks,
  tankId,
  className,
  onToggleTask,
}: UpcomingMaintenanceProps) {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
    onToggleTask?.(id);
  };

  return (
    <div className={cn("px-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-brand-navy">Upcoming Maintenance</h2>
        <Link
          href={tankId ? `/tanks/${tankId}/maintenance` : "/maintenance"}
          className="text-sm text-brand-teal font-medium hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 flex items-center gap-3"
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
                task.completed
                  ? "bg-brand-teal border-brand-teal"
                  : "border-gray-300 hover:border-brand-teal"
              )}
            >
              {task.completed && <Check className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1">
              <h3
                className={cn(
                  "font-medium",
                  task.completed ? "text-gray-400 line-through" : "text-brand-navy"
                )}
              >
                {task.title}
              </h3>
              <p className="text-sm text-gray-500">{task.due}</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
