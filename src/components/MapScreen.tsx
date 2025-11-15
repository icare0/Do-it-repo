import { ArrowLeft, MapPin, Navigation, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Screen, Task } from '../App';

interface MapScreenProps {
  tasks: Task[];
  onNavigate: (screen: Screen) => void;
  onSelectTask: (task: Task) => void;
}

export function MapScreen({ tasks, onNavigate, onSelectTask }: MapScreenProps) {
  const tasksWithLocation = tasks.filter(t => t.location);

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Map */}
      <div className="flex-1 relative bg-gradient-to-br from-blue-100 via-violet-100 to-pink-100">
        {/* Map Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        {/* Location Pins */}
        {tasksWithLocation.map((task, index) => (
          <div
            key={task.id}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-110"
            style={{
              left: `${30 + index * 25}%`,
              top: `${40 + index * 15}%`
            }}
            onClick={() => onSelectTask(task)}
          >
            <div className="relative">
              <div className={`w-12 h-12 ${
                task.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
              } rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-500" />
            </div>
          </div>
        ))}

        {/* Current Location */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-blue-500">
              <Navigation className="w-8 h-8 text-blue-500" />
            </div>
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
          </div>
        </div>
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 px-6 pt-12 pb-6 bg-gradient-to-b from-white/95 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10 bg-white shadow-md"
            onClick={() => onNavigate('today')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-neutral-900">Carte des tâches</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10 bg-white shadow-md"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="px-6 py-6 bg-white rounded-t-3xl shadow-2xl">
        <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-6" />
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-neutral-900">Tâches à proximité</h2>
          <span className="text-blue-500">{tasksWithLocation.length}</span>
        </div>

        <div className="space-y-3 max-h-48 overflow-y-auto">
          {tasksWithLocation.map((task) => (
            <div 
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl hover:bg-neutral-100 cursor-pointer transition-colors"
            >
              <div className={`w-10 h-10 ${
                task.priority === 'high' ? 'bg-red-100' : 'bg-blue-100'
              } rounded-xl flex items-center justify-center`}>
                <MapPin className={`w-5 h-5 ${
                  task.priority === 'high' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-neutral-900">{task.title}</h3>
                <p className="text-neutral-500">{task.location?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-500">1.2 km</p>
                <p className="text-neutral-500">~5 min</p>
              </div>
            </div>
          ))}
        </div>

        <Button 
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 mt-4"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Optimiser mon itinéraire
        </Button>
      </div>
    </div>
  );
}
