import { ArrowLeft, MapPin, Clock, Bell, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Screen } from '../App';

interface NotificationMockupProps {
  onNavigate: (screen: Screen) => void;
}

export function NotificationMockup({ onNavigate }: NotificationMockupProps) {
  const notifications = [
    {
      id: 1,
      type: 'location',
      icon: MapPin,
      iconBg: 'bg-blue-500',
      title: 'Tâches à proximité',
      message: 'Vous êtes près de Carrefour : 3 tâches à faire',
      time: 'Il y a 5 min',
      action: 'Voir les tâches'
    },
    {
      id: 2,
      type: 'time',
      icon: Clock,
      iconBg: 'bg-violet-500',
      title: 'Temps libre avant réunion',
      message: 'Il vous reste 15 min avant votre réunion. Vous pouvez effectuer : Appeler X, Tâche Y',
      time: 'Il y a 10 min',
      action: 'Choisir une tâche'
    },
    {
      id: 3,
      type: 'reminder',
      icon: Bell,
      iconBg: 'bg-orange-500',
      title: 'Rappel de tâche',
      message: 'N\'oubliez pas d\'acheter du lait aujourd\'hui',
      time: 'Il y a 1h',
      action: 'Marquer comme fait'
    },
    {
      id: 4,
      type: 'location',
      icon: MapPin,
      iconBg: 'bg-green-500',
      title: 'Nouvelle zone détectée',
      message: 'Vous êtes à la pharmacie. Voulez-vous créer une tâche ?',
      time: 'Il y a 2h',
      action: 'Créer une tâche'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-neutral-50 to-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={() => onNavigate('today')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-neutral-900">Notifications</h1>
          <Button 
            variant="ghost"
            className="text-blue-500 hover:text-blue-600"
          >
            Tout lire
          </Button>
        </div>
      </div>

      {/* Demo Phone Display */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-violet-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="w-6 h-6" />
            <span>Aperçu des notifications intelligentes</span>
          </div>
          <p className="text-white/80">
            Recevez des suggestions contextualisées basées sur votre position et votre emploi du temps
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {notifications.map((notif) => {
            const IconComponent = notif.icon;
            
            return (
              <div 
                key={notif.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 ${notif.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-neutral-900">{notif.title}</h3>
                      <span className="text-neutral-400 whitespace-nowrap ml-2">
                        {notif.time}
                      </span>
                    </div>
                    
                    <p className="text-neutral-600 mb-3 leading-relaxed">
                      {notif.message}
                    </p>
                    
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 rounded-xl h-9"
                    >
                      {notif.action}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Example Notification Cards */}
        <div className="mt-8">
          <h2 className="text-neutral-900 mb-4">Exemples de notifications</h2>
          
          {/* Location-based */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 mb-3 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-neutral-900">Notification géolocalisée</p>
                <p className="text-neutral-600">Basée sur votre position</p>
              </div>
            </div>
            <div className="bg-white/80 rounded-xl p-3 mt-3">
              <p className="text-neutral-700">
                "Vous êtes près de Carrefour : 3 tâches à faire"
              </p>
            </div>
          </div>

          {/* Time-based */}
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-4 border-2 border-violet-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-neutral-900">Notification temporelle</p>
                <p className="text-neutral-600">Basée sur votre agenda</p>
              </div>
            </div>
            <div className="bg-white/80 rounded-xl p-3 mt-3">
              <p className="text-neutral-700">
                "Il vous reste 15 min avant votre réunion. Vous pouvez effectuer : [Appeler X], [Tâche Y]"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
