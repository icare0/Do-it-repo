import { create } from 'zustand';
import { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  filter: 'all' | 'today' | 'upcoming' | 'completed';
  searchQuery: string;

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilter: (filter: TaskState['filter']) => void;
  setSearchQuery: (query: string) => void;
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  filter: 'all',
  searchQuery: '',

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => {
    // Prevent duplicates
    if (state.tasks.some(t => t.id === task.id)) {
      return state;
    }
    return {
      tasks: [...state.tasks, task]
    };
  }),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
    ),
  })),

  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== taskId),
    selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
  })),

  toggleTaskCompletion: (taskId) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (task && !task.completed) {
        // Award points for completing a task
        const userStore = require('./userStore').useUserStore;
        userStore.getState().addPoints(10);
        userStore.getState().updateStreak();
      }

      return {
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed, updatedAt: new Date() } : task
        ),
      };
    });
  },

  setSelectedTask: (task) => set({ selectedTask: task }),

  setFilter: (filter) => set({ filter }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  getFilteredTasks: () => {
    const { tasks, filter, searchQuery } = get();
    const today = new Date().toISOString().split('T')[0];

    let filtered = tasks;

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    switch (filter) {
      case 'today':
        filtered = filtered.filter((task) =>
          task.startDate?.toISOString().split('T')[0] === today && !task.completed
        );
        break;
      case 'upcoming':
        filtered = filtered.filter((task) =>
          !task.completed && task.startDate
        );
        break;
      case 'completed':
        filtered = filtered.filter((task) => task.completed);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.startDate && b.startDate) return a.startDate.getTime() - b.startDate.getTime();
      return 0;
    });
  },
}));
