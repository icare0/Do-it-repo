import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TodayScreen } from './components/TodayScreen';
import { QuickAddTask } from './components/QuickAddTask';
import { TaskDetail } from './components/TaskDetail';
import { MapScreen } from './components/MapScreen';
import { TaskList } from './components/TaskList';
import { CalendarScreen } from './components/CalendarScreen';
import { NotificationMockup } from './components/NotificationMockup';
import { SettingsScreen } from './components/SettingsScreen';

export type Screen = 
  | 'login' 
  | 'today' 
  | 'add-task' 
  | 'task-detail' 
  | 'map' 
  | 'list' 
  | 'calendar' 
  | 'notifications' 
  | 'settings';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date?: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  duration?: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Acheter du lait',
      completed: false,
      date: '2024-11-15',
      time: '10:00',
      category: 'Courses',
      priority: 'medium',
      location: { name: 'Carrefour', lat: 48.8566, lng: 2.3522 }
    },
    {
      id: '2',
      title: 'Réunion équipe',
      completed: false,
      date: '2024-11-15',
      time: '14:00',
      duration: 60,
      category: 'Travail',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Appeler maman',
      completed: true,
      date: '2024-11-15',
      time: '09:00',
      category: 'Personnel',
      priority: 'medium'
    }
  ]);

  const navigateTo = (screen: Screen, task?: Task) => {
    if (task) setSelectedTask(task);
    setCurrentScreen(screen);
  };

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
    setCurrentScreen('today');
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setCurrentScreen('today');
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setCurrentScreen('today');
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[812px] bg-white rounded-[40px] shadow-2xl overflow-hidden relative">
        {currentScreen === 'login' && (
          <LoginScreen onNavigate={navigateTo} />
        )}
        {currentScreen === 'today' && (
          <TodayScreen 
            tasks={tasks}
            onNavigate={navigateTo}
            onToggleTask={toggleTaskCompletion}
          />
        )}
        {currentScreen === 'add-task' && (
          <QuickAddTask 
            onNavigate={navigateTo}
            onAddTask={addTask}
          />
        )}
        {currentScreen === 'task-detail' && selectedTask && (
          <TaskDetail 
            task={selectedTask}
            onNavigate={navigateTo}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
        {currentScreen === 'map' && (
          <MapScreen 
            tasks={tasks}
            onNavigate={navigateTo}
            onSelectTask={(task) => navigateTo('task-detail', task)}
          />
        )}
        {currentScreen === 'list' && (
          <TaskList 
            tasks={tasks}
            onNavigate={navigateTo}
            onSelectTask={(task) => navigateTo('task-detail', task)}
            onToggleTask={toggleTaskCompletion}
          />
        )}
        {currentScreen === 'calendar' && (
          <CalendarScreen 
            tasks={tasks}
            onNavigate={navigateTo}
          />
        )}
        {currentScreen === 'notifications' && (
          <NotificationMockup onNavigate={navigateTo} />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen onNavigate={navigateTo} />
        )}
      </div>
    </div>
  );
}

export default App;