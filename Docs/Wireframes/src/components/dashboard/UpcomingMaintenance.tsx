import { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { motion } from 'motion/react';

const initialTasks = [
  { id: 1, title: 'Water change (20%)', due: 'Due Saturday', completed: false },
  { id: 2, title: 'Dose calcium', due: 'Due tomorrow', completed: false },
  { id: 3, title: 'Clean filter media', due: 'Due in 5 days', completed: false },
];

export function UpcomingMaintenance() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#0A2463]">Upcoming Maintenance</h2>
        <button className="text-sm text-[#1B998B] font-medium">View All</button>
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
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                task.completed
                  ? 'bg-[#1B998B] border-[#1B998B]'
                  : 'border-gray-300 hover:border-[#1B998B]'
              }`}
            >
              {task.completed && <Check className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1">
              <h3
                className={`font-medium ${
                  task.completed ? 'text-gray-400 line-through' : 'text-[#0A2463]'
                }`}
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
