import { useState } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Tag, Clock, MapPin, ChevronDown, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Screen, Task } from '../App';

interface QuickAddTaskProps {
  onNavigate: (screen: Screen) => void;
  onAddTask: (task: Task) => void;
}

export function QuickAddTask({ onNavigate, onAddTask }: QuickAddTaskProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setShowTimePicker(true);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setSelectedEndDate(date);
    if (date) {
      setShowEndTimePicker(true);
    }
  };

  const handleTimeConfirm = () => {
    setShowTimePicker(false);
  };

  const handleEndTimeConfirm = () => {
    setShowEndTimePicker(false);
    setShowEndDatePicker(false);
  };

  const clearDateTime = () => {
    setSelectedDate(undefined);
    setTime('');
    setSelectedEndDate(undefined);
    setEndTime('');
  };

  const clearEndDateTime = () => {
    setSelectedEndDate(undefined);
    setEndTime('');
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
      time: time || undefined,
      endDate: selectedEndDate ? selectedEndDate.toISOString().split('T')[0] : undefined,
      endTime: endTime || undefined,
      duration: duration ? parseInt(duration) : undefined,
      category: category || undefined,
      priority: 'medium'
    };

    onAddTask(newTask);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={() => onNavigate('today')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-neutral-900">Nouvelle tâche</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Title */}
        <div className="mb-6">
          <Input 
            placeholder="Titre de la tâche..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-14 px-5 rounded-2xl border-neutral-200 bg-neutral-50"
            autoFocus
          />
        </div>

        {/* Date & Time Section - Always Visible */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-900">Date et heure</h3>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateTime}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X className="w-4 h-4 mr-1" />
                Effacer tout
              </Button>
            )}
          </div>

          {/* Selected Date/Time Display */}
          {selectedDate && (
            <div className="space-y-2 mb-4">
              {/* Start Date */}
              <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-2xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-500 text-xs mb-0.5">Début</p>
                    <p className="text-neutral-900">{formatShortDate(selectedDate)}</p>
                    {time && <p className="text-blue-600">{time}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTimePicker(true)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs px-2"
                  >
                    {time ? 'Modifier' : '+ Heure'}
                  </Button>
                </div>
              </div>

              {/* End Date */}
              {selectedEndDate ? (
                <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-4 border-2 border-violet-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-500 text-xs mb-0.5">Fin</p>
                      <p className="text-neutral-900">{formatShortDate(selectedEndDate)}</p>
                      {endTime && <p className="text-violet-600">{endTime}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEndTimePicker(true)}
                      className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 text-xs px-2"
                    >
                      {endTime ? 'Modifier' : '+ Heure'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearEndDateTime}
                      className="h-8 w-8 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowEndDatePicker(true)}
                  className="w-full h-12 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Ajouter une date de fin
                </Button>
              )}
            </div>
          )}

          {/* Calendar - Only show start date picker by default */}
          {!showEndDatePicker && (
            <>
              <div className="bg-neutral-50 rounded-2xl p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-xl"
                />
              </div>
              
              <p className="text-neutral-500 text-center mt-3">
                Sélectionnez une date pour planifier votre tâche (optionnel)
              </p>
            </>
          )}

          {/* End Date Calendar - Only show when adding end date */}
          {showEndDatePicker && (
            <>
              <div className="bg-violet-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-neutral-900">Date de fin</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEndDatePicker(false)}
                    className="text-neutral-500"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Annuler
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedEndDate}
                  onSelect={handleEndDateSelect}
                  disabled={(date) => selectedDate ? date < selectedDate : false}
                  className="rounded-xl"
                />
              </div>
              
              <p className="text-neutral-500 text-center mt-3">
                Sélectionnez la date de fin de votre tâche
              </p>
            </>
          )}
        </div>

        {/* Options avancées */}
        {!showAdvanced && (
          <Button 
            variant="ghost"
            onClick={() => setShowAdvanced(true)}
            className="w-full h-12 rounded-2xl text-blue-500 hover:text-blue-600 hover:bg-blue-50 mb-4"
          >
            <ChevronDown className="w-5 h-5 mr-2" />
            Options avancées
          </Button>
        )}

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4">
            <div>
              <label className="block text-neutral-700 mb-2">Description</label>
              <Textarea 
                placeholder="Ajouter une description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] rounded-2xl border-neutral-200 bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-neutral-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-500" />
                Durée estimée (minutes)
              </label>
              <Input 
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-12 rounded-2xl border-neutral-200 bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-neutral-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-neutral-500" />
                Catégorie
              </label>
              <div className="flex flex-wrap gap-2">
                {['Personnel', 'Travail', 'Courses', 'Sport', 'Autre'].map((cat) => (
                  <Button
                    key={cat}
                    variant={category === cat ? 'default' : 'outline'}
                    onClick={() => setCategory(cat)}
                    className={`rounded-full ${
                      category === cat 
                        ? 'bg-gradient-to-r from-blue-500 to-violet-500' 
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-500" />
                Localisation
              </label>
              <Button 
                variant="outline"
                className="w-full h-12 rounded-2xl border-neutral-200 hover:bg-neutral-50 justify-start"
              >
                <MapPin className="w-4 h-4 mr-2 text-neutral-500" />
                Ajouter un lieu
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Time Picker Dialog */}
      <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisir l'heure</DialogTitle>
            <DialogDescription>
              Définissez une heure précise ou laissez vide pour une tâche sur toute la journée
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input 
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-14 rounded-2xl border-neutral-200 text-center"
            />
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                setTime('');
                setShowTimePicker(false);
              }}
              className="flex-1 h-12 rounded-2xl"
            >
              Toute la journée
            </Button>
            <Button 
              onClick={handleTimeConfirm}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Time Picker Dialog */}
      <Dialog open={showEndTimePicker} onOpenChange={setShowEndTimePicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisir l'heure de fin</DialogTitle>
            <DialogDescription>
              Définissez une heure précise ou laissez vide pour une tâche sur toute la journée
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input 
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-14 rounded-2xl border-neutral-200 text-center"
            />
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                setEndTime('');
                setShowEndTimePicker(false);
              }}
              className="flex-1 h-12 rounded-2xl"
            >
              Toute la journée
            </Button>
            <Button 
              onClick={handleEndTimeConfirm}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="p-6 border-t border-neutral-100">
        <Button 
          onClick={handleAdd}
          disabled={!title.trim()}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:opacity-50"
        >
          Créer la tâche
        </Button>
      </div>
    </div>
  );
}