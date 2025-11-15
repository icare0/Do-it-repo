import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Clock, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Screen, Task } from '../App';
import { useState } from 'react';

interface CalendarScreenProps {
  tasks: Task[];
  onNavigate: (screen: Screen) => void;
}

export function CalendarScreen({ tasks, onNavigate }: CalendarScreenProps) {
  const [selectedDate, setSelectedDate] = useState(15);
  
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const todayTasks = tasks.filter(t => t.date === '2024-11-15');
  
  const timeSlots = [
    { time: '09:00', type: 'task', task: todayTasks[2] },
    { time: '10:00', type: 'task', task: todayTasks[0] },
    { time: '11:00', type: 'free', duration: 60 },
    { time: '12:00', type: 'free', duration: 60 },
    { time: '13:00', type: 'free', duration: 60 },
    { time: '14:00', type: 'task', task: todayTasks[1] },
    { time: '15:00', type: 'free', duration: 60 },
    { time: '16:00', type: 'free', duration: 60 },
  ];

  const suggestedTasks = [
    { title: 'Réviser présentation', duration: 30 },
    { title: 'Répondre emails', duration: 20 },
    { title: 'Appeler fournisseur', duration: 15 },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-violet-50/30 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={() => onNavigate('today')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-neutral-900">Agenda</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-neutral-900">Novembre 2024</h2>
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Mini Calendar */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="text-center text-neutral-500 pb-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.slice(0, 21).map((day) => {
            const hasTask = tasks.some(t => t.date === `2024-11-${day.toString().padStart(2, '0')}`);
            const isSelected = day === selectedDate;
            const isToday = day === 15;
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                  ${isSelected ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg scale-110' : 'hover:bg-neutral-100'}
                  ${isToday && !isSelected ? 'border-2 border-blue-500' : ''}
                `}
              >
                <span className={isSelected ? '' : 'text-neutral-900'}>{day}</span>
                {hasTask && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Schedule */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-neutral-900">15 Novembre</h2>
          <span className="text-neutral-500">{todayTasks.length} événements</span>
        </div>

        <div className="space-y-2 mb-6">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex gap-3">
              <div className="w-16 text-neutral-500 pt-1">{slot.time}</div>
              
              {slot.type === 'task' && slot.task ? (
                <div className="flex-1 bg-gradient-to-r from-blue-500/10 to-violet-500/10 border-l-4 border-blue-500 rounded-2xl p-4">
                  <h3 className="text-neutral-900 mb-1">{slot.task.title}</h3>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Clock className="w-4 h-4" />
                    <span>{slot.task.duration ? `${slot.task.duration} min` : '1h'}</span>
                    {slot.task.category && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg">
                        {slot.task.category}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-neutral-50 border-l-4 border-neutral-200 rounded-2xl p-4 border-dashed">
                  <p className="text-neutral-400">Créneau libre</p>
                  <p className="text-neutral-400">{slot.duration} min</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggested Tasks */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-neutral-900">Suggestions intelligentes</h3>
          </div>
          
          <p className="text-neutral-600 mb-3">
            Tâches réalisables dans vos créneaux libres :
          </p>
          
          <div className="space-y-2">
            {suggestedTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-neutral-900">{task.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">{task.duration} min</span>
                  <Button size="sm" variant="ghost" className="rounded-lg">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
