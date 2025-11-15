import { ArrowLeft, Filter, Search, Circle, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Screen, Task } from '../App';
import { useState } from 'react';

interface TaskListProps {
  tasks: Task[];
  onNavigate: (screen: Screen) => void;
  onSelectTask: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
}

export function TaskList({ tasks, onNavigate, onSelectTask, onToggleTask }: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'completed') return matchesSearch && task.completed;
    if (filter === 'today') return matchesSearch && task.date === '2024-11-15';
    if (filter === 'upcoming') return matchesSearch && !task.completed && task.date;
    
    return matchesSearch;
  });

  const categories = ['Toutes', 'Travail', 'Personnel', 'Courses', 'Sport'];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-blue-50/30 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={() => onNavigate('today')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-neutral-900">Toutes les tâches</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input 
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 rounded-2xl border-neutral-200 bg-white shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'today', label: "Aujourd'hui" },
            { key: 'upcoming', label: 'À venir' },
            { key: 'completed', label: 'Terminées' }
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              onClick={() => setFilter(f.key as any)}
              className={`rounded-full whitespace-nowrap ${
                filter === f.key 
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500' 
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Tags */}
      <div className="px-6 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 whitespace-nowrap transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500">Aucune tâche trouvée</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-white border border-neutral-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className="mt-0.5"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-neutral-300" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-neutral-900 mb-1 ${task.completed ? 'line-through text-neutral-400' : ''}`}>
                      {task.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-neutral-500">
                      {task.date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.time || 'Toute la journée'}
                        </span>
                      )}
                      
                      {task.category && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg">
                          {task.category}
                        </span>
                      )}
                      
                      {task.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {task.location.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {task.priority === 'high' && (
                    <div className="w-1 h-full bg-red-500 rounded-full self-stretch" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-neutral-900">{tasks.length}</p>
            <p className="text-neutral-500">Total</p>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <div className="text-center">
            <p className="text-blue-500">{tasks.filter(t => !t.completed).length}</p>
            <p className="text-neutral-500">En cours</p>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <div className="text-center">
            <p className="text-green-500">{tasks.filter(t => t.completed).length}</p>
            <p className="text-neutral-500">Terminées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
