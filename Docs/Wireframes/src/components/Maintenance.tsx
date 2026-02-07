import { useState } from 'react';
import { ArrowLeft, Plus, Check, Calendar, Droplets, Filter, FlaskConical, Wrench, X, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const taskTypes = [
  { id: 'water-change', label: 'Water Change', icon: Droplets, color: '#1B998B' },
  { id: 'filter-cleaning', label: 'Filter Cleaning', icon: Filter, color: '#0A2463' },
  { id: 'dosing', label: 'Dosing', icon: FlaskConical, color: '#F59E0B' },
  { id: 'custom', label: 'Custom', icon: Wrench, color: '#6B7280' },
];

const frequencies = ['One-time', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'];

const initialTasks = [
  {
    id: 1,
    title: 'Water change (20%)',
    type: 'water-change',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    recurring: 'Weekly',
    completed: false,
    notes: 'Test parameters after change',
  },
  {
    id: 2,
    title: 'Dose calcium',
    type: 'dosing',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    recurring: 'Daily',
    completed: false,
    notes: '10ml',
  },
  {
    id: 3,
    title: 'Clean protein skimmer',
    type: 'filter-cleaning',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    recurring: 'Weekly',
    completed: false,
    notes: '',
  },
  {
    id: 4,
    title: 'Replace filter media',
    type: 'filter-cleaning',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    recurring: 'Monthly',
    completed: false,
    notes: 'Check carbon and GFO',
  },
  {
    id: 5,
    title: 'Check pump flow',
    type: 'custom',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    recurring: 'Monthly',
    completed: false,
    notes: '',
  },
];

export function Maintenance() {
  const [tasks, setTasks] = useState(initialTasks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'water-change',
    frequency: 'Weekly',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const isOverdue = (date: Date) => {
    return date < new Date() && date.toDateString() !== new Date().toDateString();
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Due today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Due tomorrow';
    if (isOverdue(date)) return `Overdue ${Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))} days`;
    
    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const sortedTasks = [...tasks].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const handleAddTask = () => {
    const newId = Math.max(...tasks.map(t => t.id)) + 1;
    setTasks([
      ...tasks,
      {
        id: newId,
        title: newTask.title,
        type: newTask.type,
        dueDate: new Date(newTask.startDate),
        recurring: newTask.frequency,
        completed: false,
        notes: newTask.notes,
      },
    ]);
    setShowAddForm(false);
    setNewTask({
      title: '',
      type: 'water-change',
      frequency: 'Weekly',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#F0F4F8]">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-[#0A2463]">Maintenance</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 bg-[#1B998B] text-white rounded-xl hover:bg-[#158f7e] transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const taskType = taskTypes.find(t => t.id === task.type);
            const TaskIcon = taskType?.icon || Wrench;
            const overdue = isOverdue(task.dueDate);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl shadow-sm p-4 ${
                  overdue ? 'border-l-4 border-[#FF6B6B]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                      task.completed
                        ? 'bg-[#1B998B] border-[#1B998B]'
                        : 'border-gray-300 hover:border-[#1B998B]'
                    }`}
                  >
                    {task.completed && <Check className="w-4 h-4 text-white" />}
                  </button>

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${taskType?.color}15` }}
                  >
                    <TaskIcon className="w-5 h-5" style={{ color: taskType?.color }} />
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-1 ${
                        task.completed ? 'text-gray-400 line-through' : 'text-[#0A2463]'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-sm font-medium ${
                          overdue ? 'text-[#FF6B6B]' : 'text-gray-600'
                        }`}
                      >
                        {formatDueDate(task.dueDate)}
                      </span>
                      {task.recurring && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-[#F0F4F8] px-2 py-1 rounded-full">
                          <Repeat className="w-3 h-3" />
                          {task.recurring}
                        </span>
                      )}
                    </div>
                    {task.notes && (
                      <p className="text-sm text-gray-600">{task.notes}</p>
                    )}
                  </div>

                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#0A2463]">Add Maintenance Task</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="w-10 h-10 bg-[#F0F4F8] rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Task Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="e.g., Water change (20%)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
                    />
                  </div>

                  {/* Task Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {taskTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setNewTask({ ...newTask, type: type.id })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            newTask.type === type.id
                              ? 'border-[#1B998B] bg-[#1B998B]/5'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <type.icon
                            className="w-6 h-6 mx-auto mb-2"
                            style={{ color: newTask.type === type.id ? type.color : '#6B7280' }}
                          />
                          <p className="text-sm font-medium text-gray-800">{type.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={newTask.frequency}
                      onChange={(e) => setNewTask({ ...newTask, frequency: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
                    >
                      {frequencies.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newTask.startDate}
                      onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Add any additional details..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors resize-none"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAddTask}
                    disabled={!newTask.title}
                    className={`w-full py-4 rounded-full font-semibold text-lg transition-colors ${
                      newTask.title
                        ? 'bg-[#1B998B] text-white shadow-lg hover:bg-[#158f7e]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
