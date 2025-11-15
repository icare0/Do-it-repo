import { Plus, Mic, Calendar, Map, List, Bell, Settings, CheckCircle2, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Screen, Task } from '../App';

interface TodayScreenProps {
  tasks: Task[];
  onNavigate: (screen: Screen, task?: Task) => void;
  onToggleTask: (taskId: string) => void;
}

export function TodayScreen({ tasks, onNavigate, onToggleTask }: TodayScreenProps) {
  const todayTasks = tasks.filter(t => t.date === '2024-11-15');
  const completedCount = todayTasks.filter(t => t.completed).length;
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50/30 to-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-neutral-500 mb-1">Samedi 15 Novembre</p>
            <h1 className="text-neutral-900">Aujourd'hui</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={() => onNavigate('notifications')}
            >
              <Bell className="w-5 h-5 text-neutral-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={() => onNavigate('settings')}
            >
              <Settings className="w-5 h-5 text-neutral-600" />
            </Button>
          </div>
        </div>

        {/* Quick Add */}
        <div className="relative mb-6">
          <Input 
            placeholder="Ajouter une tâche rapidement..."
            onClick={() => onNavigate('add-task')}
            readOnly
            className="h-14 pl-5 pr-14 rounded-2xl border-neutral-200 bg-white shadow-sm"
          />
          <Button 
            size="icon"
            className="absolute right-2 top-2 rounded-xl w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
          >
            <Mic className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Shortcuts */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={() => onNavigate('calendar')}
            className="flex-1 h-12 rounded-2xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 shadow-sm"
            variant="outline"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agenda
          </Button>
          <Button 
            onClick={() => onNavigate('map')}
            className="flex-1 h-12 rounded-2xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 shadow-sm"
            variant="outline"
          >
            <Map className="w-4 h-4 mr-2" />
            Carte
          </Button>
          <Button 
            onClick={() => onNavigate('list')}
            className="flex-1 h-12 rounded-2xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 shadow-sm"
            variant="outline"
          >
            <List className="w-4 h-4 mr-2" />
            Liste
          </Button>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600">Progression du jour</span>
            <span className="text-blue-500">{completedCount}/{todayTasks.length}</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
              style={{ width: `${todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <h2 className="text-neutral-900 mb-4">Timeline de la journée</h2>
        
        <div className="space-y-4">
          {todayTasks.map((task, index) => (
            <div key={task.id} className="flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-green-500' : 'bg-blue-500'}`} />
                {index < todayTasks.length - 1 && (
                  <div className="w-px h-full bg-neutral-200 my-1" />
                )}
              </div>

              {/* Task Card */}
              <div 
                onClick={() => onNavigate('task-detail', task)}
                className="flex-1 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-4"
              >
                <div className="flex items-start gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className="mt-1"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-neutral-300" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className={`text-neutral-900 mb-1 ${task.completed ? 'line-through text-neutral-400' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 text-neutral-500">
                      <span>{task.time}</span>
                      {task.duration && <span>• {task.duration} min</span>}
                      {task.category && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg">
                          {task.category}
                        </span>
                      )}
                    </div>
                    {task.location && (
                      <div className="flex items-center gap-1 mt-2 text-neutral-500">
                        <Map className="w-4 h-4" />
                        <span>{task.location.name}</span>
                      </div>
                    )}
                  </div>

                  {task.priority === 'high' && (
                    <div className="w-1 h-12 bg-red-500 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <Button 
        onClick={() => onNavigate('add-task')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 shadow-xl"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
