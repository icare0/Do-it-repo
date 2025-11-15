import { ArrowLeft, Calendar, Clock, Tag, MapPin, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Screen, Task } from '../App';
import { useState } from 'react';

interface TaskDetailProps {
  task: Task;
  onNavigate: (screen: Screen) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskDetail({ task, onNavigate, onUpdateTask, onDeleteTask }: TaskDetailProps) {
  const [isCompleted, setIsCompleted] = useState(task.completed);

  const handleToggleComplete = () => {
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    onUpdateTask({ ...task, completed: newCompleted });
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      onDeleteTask(task.id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-br from-blue-50/30 to-white">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={() => onNavigate('today')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full w-10 h-10 hover:bg-blue-100 hover:text-blue-600"
            >
              <Edit className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDelete}
              className="rounded-full w-10 h-10 hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Title & Status */}
        <div className="mb-6">
          <h1 className={`text-neutral-900 mb-4 ${isCompleted ? 'line-through text-neutral-400' : ''}`}>
            {task.title}
          </h1>
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
            <span className="text-neutral-700">Tâche terminée</span>
            <Switch checked={isCompleted} onCheckedChange={handleToggleComplete} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h2 className="text-neutral-900 mb-3">Description</h2>
            <p className="text-neutral-600 leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Details */}
        <div className="space-y-4 mb-6">
          <h2 className="text-neutral-900">Détails</h2>
          
          {task.date && (
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-neutral-500">Date</p>
                <p className="text-neutral-900">
                  {new Date(task.date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}

          {task.time && (
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-neutral-500">Heure</p>
                <p className="text-neutral-900">{task.time}</p>
              </div>
            </div>
          )}

          {task.duration && (
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-neutral-500">Durée estimée</p>
                <p className="text-neutral-900">{task.duration} minutes</p>
              </div>
            </div>
          )}

          {task.category && (
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-neutral-500">Catégorie</p>
                <p className="text-neutral-900">{task.category}</p>
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        {task.location && (
          <div className="mb-6">
            <h2 className="text-neutral-900 mb-3">Localisation</h2>
            <div className="bg-neutral-50 rounded-2xl overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-blue-200 to-violet-200 flex items-center justify-center relative">
                <MapPin className="w-12 h-12 text-white drop-shadow-lg" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-900 mb-1">{task.location.name}</p>
                    <p className="text-neutral-500">
                      {task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onNavigate('map')}
                  >
                    Voir sur la carte
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-neutral-100">
        <Button 
          onClick={handleToggleComplete}
          className={`w-full h-14 rounded-2xl ${
            isCompleted 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600'
          }`}
        >
          {isCompleted ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
        </Button>
      </div>
    </div>
  );
}
