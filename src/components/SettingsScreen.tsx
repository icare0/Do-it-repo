import { ArrowLeft, Sun, Moon, Calendar, MapPin, Tag, User, Bell, Smartphone, LogOut, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Screen } from '../App';
import { useState } from 'react';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [geofencing, setGeofencing] = useState(true);
  const [calendarSync, setCalendarSync] = useState(true);

  const settingsSections = [
    {
      title: 'Apparence',
      items: [
        {
          icon: darkMode ? Moon : Sun,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          label: 'Mode sombre',
          value: darkMode,
          onToggle: setDarkMode,
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Intégrations',
      items: [
        {
          icon: Calendar,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          label: 'Synchronisation agenda',
          subtitle: 'Google Calendar',
          value: calendarSync,
          onToggle: setCalendarSync,
          type: 'toggle'
        },
        {
          icon: MapPin,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          label: 'Géofencing',
          subtitle: 'Notifications basées sur la localisation',
          value: geofencing,
          onToggle: setGeofencing,
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          iconBg: 'bg-violet-100',
          iconColor: 'text-violet-600',
          label: 'Notifications push',
          subtitle: 'Rappels et suggestions',
          value: notifications,
          onToggle: setNotifications,
          type: 'toggle'
        },
        {
          icon: Smartphone,
          iconBg: 'bg-pink-100',
          iconColor: 'text-pink-600',
          label: 'Notifications contextuelles',
          subtitle: 'Basées sur votre activité',
          type: 'link'
        }
      ]
    },
    {
      title: 'Personnalisation',
      items: [
        {
          icon: Tag,
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          label: 'Catégories & Tags',
          subtitle: 'Gérer vos catégories',
          type: 'link'
        }
      ]
    },
    {
      title: 'Compte',
      items: [
        {
          icon: User,
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          label: 'Profil',
          subtitle: 'john.doe@email.com',
          type: 'link'
        },
        {
          icon: LogOut,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          label: 'Déconnexion',
          type: 'button',
          onClick: () => onNavigate('login')
        }
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-neutral-50 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={() => onNavigate('today')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-neutral-900">Paramètres</h1>
          <div className="w-10" />
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-white mb-1">John Doe</h2>
              <p className="text-white/80">john.doe@email.com</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-white/80 mb-1">Tâches</p>
              <p className="text-white">24</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-white/80 mb-1">Terminées</p>
              <p className="text-white">18</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-white/80 mb-1">Série</p>
              <p className="text-white">7 j</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="text-neutral-500 mb-3 px-2">{section.title}</h3>
            
            <div className="bg-neutral-50 rounded-2xl overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                
                return (
                  <div
                    key={itemIndex}
                    className={`flex items-center gap-4 p-4 ${
                      itemIndex < section.items.length - 1 ? 'border-b border-neutral-200' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-900">{item.label}</p>
                      {item.subtitle && (
                        <p className="text-neutral-500">{item.subtitle}</p>
                      )}
                    </div>
                    
                    {item.type === 'toggle' && item.onToggle && (
                      <Switch 
                        checked={item.value as boolean} 
                        onCheckedChange={item.onToggle}
                      />
                    )}
                    
                    {item.type === 'link' && (
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    )}
                    
                    {item.type === 'button' && item.onClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={item.onClick}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Déconnexion
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* App Info */}
        <div className="text-center py-6 text-neutral-400">
          <p>Do'It v1.0.0</p>
          <p className="mt-1">© 2024 - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}
