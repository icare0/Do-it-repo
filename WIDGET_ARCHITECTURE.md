# 📱 Architecture des Widgets - Système de Tâches Intelligent

## 🎯 Vue d'Ensemble

Cette architecture définit 4 types de widgets magnifiques et utiles pour iOS et Android.

---

## 📦 Types de Widgets

### 1. **Today Widget** - Tâches du Jour
**Tailles**: Small, Medium, Large

**Contenu:**
- **Small**: Prochaine tâche + compte (ex: "3 tâches")
- **Medium**: 3-4 tâches avec checkboxes + progression
- **Large**: 6-8 tâches + progression + suggestions

**Fonctionnalités:**
- Affiche les tâches non complétées du jour
- Progression visuelle (barre ou cercle)
- Deep link vers TodayScreen
- Tap sur tâche → TaskDetail
- Refresh automatique toutes les 15 min

**Design:**
- Fond blanc/noir (selon dark mode)
- Icônes SF Symbols (iOS) / Material Icons (Android)
- Bordure arrondie avec ombre subtile
- Checkboxes interactives (Android seulement)

---

### 2. **Next Task Widget** - Prochaine Tâche Urgente
**Tailles**: Small

**Contenu:**
- Titre de la prochaine tâche
- Heure (si planifiée)
- Badge de priorité (couleur)
- Catégorie (icône)

**Fonctionnalités:**
- Affiche la tâche la plus urgente non complétée
- Tap → Ouvre TaskDetail
- Long press → Marquer comme complétée (Android)

**Design:**
- Grand texte lisible
- Couleur d'accent selon priorité
  - High: Rouge (#EF4444)
  - Medium: Orange (#F59E0B)
  - Low: Vert (#10B981)
- Icône de catégorie en haut à droite

---

### 3. **Stats Widget** - Statistiques & Gamification
**Tailles**: Medium

**Contenu:**
- Streak actuel (🔥 X jours)
- Tâches complétées aujourd'hui
- Progression hebdomadaire (graphique simple)
- Message motivant

**Fonctionnalités:**
- Affiche les stats de gamification
- Graphique sparkline (7 derniers jours)
- Tap → Ouvre StatsScreen

**Design:**
- Grille 2x2 pour les métriques
- Graphique en bas
- Couleurs vives pour les achievements
- Emojis pour engagement

---

### 4. **Smart Suggestions Widget** - Optimisations IA
**Tailles**: Medium

**Contenu:**
- 1-2 suggestions d'optimisation
- Type de suggestion (icône)
- Impact (temps/distance économisés)
- Bouton "Voir tout"

**Fonctionnalités:**
- Affiche les suggestions non vues
- Badge de notification
- Tap → Ouvre SmartAssistantScreen
- Suggestions prioritaires d'abord

**Design:**
- Style "card" avec icône 💡
- Impact en vert (gains)
- Badge rouge si suggestions critiques
- Fond légèrement coloré

---

## 🎨 Design System

### Palette de Couleurs

**Light Mode:**
```
Background: #FFFFFF
Card: #F9FAFB
Text Primary: #1F2937
Text Secondary: #6B7280
Border: #E5E7EB
Accent: #3B82F6
Success: #10B981
Warning: #F59E0B
Error: #EF4444
```

**Dark Mode:**
```
Background: #1F2937
Card: #374151
Text Primary: #F9FAFB
Text Secondary: #9CA3AF
Border: #4B5563
Accent: #60A5FA
Success: #34D399
Warning: #FBBF24
Error: #F87171
```

### Typography

**iOS (SF Pro):**
```
Large Title: 34pt Bold
Title: 28pt Semibold
Headline: 17pt Semibold
Body: 17pt Regular
Caption: 12pt Regular
```

**Android (Roboto):**
```
H1: 24sp Bold
H2: 20sp Medium
Body1: 16sp Regular
Body2: 14sp Regular
Caption: 12sp Regular
```

### Spacing

```
Tiny: 4px
Small: 8px
Medium: 16px
Large: 24px
XLarge: 32px
```

### Corner Radius

```
Small: 8px
Medium: 12px
Large: 16px
Circle: 999px
```

---

## 📐 Tailles des Widgets

### iOS (WidgetKit)

**Small (158x158 pt)**
- Content padding: 16pt
- Usable area: 126x126 pt

**Medium (360x158 pt)**
- Content padding: 16pt
- Usable area: 328x126 pt

**Large (360x376 pt)**
- Content padding: 16pt
- Usable area: 328x344 pt

### Android (dp)

**Small (2x2 cells)**
- Min: 120x120 dp
- Target: 180x180 dp

**Medium (4x2 cells)**
- Min: 250x120 dp
- Target: 380x180 dp

**Large (4x4 cells)**
- Min: 250x250 dp
- Target: 380x380 dp

---

## 🔗 Deep Linking

### URL Scheme: `doit://`

**Routes:**
```
doit://today             → TodayScreen
doit://task/:id          → TaskDetail
doit://stats             → StatsScreen
doit://smart-assistant   → SmartAssistantScreen
doit://quick-add         → QuickAddScreen
```

**Exemples:**
```swift
// iOS
URL(string: "doit://task/abc123")

// Android
Intent(Intent.ACTION_VIEW, Uri.parse("doit://task/abc123"))
```

---

## 📊 Data Flow

### Architecture

```
┌─────────────────────────────────────────┐
│         React Native App                │
├─────────────────────────────────────────┤
│  WidgetDataProvider Service             │
│  - Expose data to native widgets        │
│  - SharedPreferences (Android)           │
│  - UserDefaults (iOS App Group)         │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌─────▼───┐
    │ iOS    │          │ Android │
    │ Widget │          │ Widget  │
    │ (Swift)│          │ (Kotlin)│
    └────────┘          └─────────┘
```

### Data Sync

**iOS:**
- App Group: `group.com.yourapp.doit`
- UserDefaults suite
- Update: Background fetch (15 min)

**Android:**
- SharedPreferences
- WorkManager for updates
- Update: Every 30 min

---

## 🔄 Update Strategy

### iOS (WidgetKit Timeline)

```swift
// Refresh every 15 minutes
let timeline = Timeline(
  entries: entries,
  policy: .after(Date().addingTimeInterval(15 * 60))
)
```

### Android (WorkManager)

```kotlin
// Periodic work request every 30 minutes
PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
  30, TimeUnit.MINUTES
)
```

---

## 🎭 Interactions

### iOS

**Tap:**
- Widget tap → Deep link
- Button tap → Deep link specific

**Long Press:**
- Show widget configuration (sizes)

### Android

**Tap:**
- Widget tap → Deep link
- Button tap → Action

**Long Press:**
- Resize widget
- Widget configuration

**Button Actions:**
- Complete task (checkmark)
- Refresh data
- Open app

---

## 🛠️ Tech Stack

### iOS

**Framework:** WidgetKit (iOS 14+)
**Language:** Swift 5.5+
**UI:** SwiftUI
**Data:** UserDefaults (App Group)
**Deep Link:** URL Scheme + Universal Links

### Android

**Framework:** Jetpack Glance (recommended) or RemoteViews
**Language:** Kotlin
**UI:** Jetpack Compose for Glance
**Data:** SharedPreferences
**Update:** WorkManager
**Deep Link:** Intent + Deep Links

### React Native Bridge

**iOS:** Native Module (Objective-C/Swift)
**Android:** Native Module (Java/Kotlin)
**Shared:** Expo Config Plugin

---

## 📁 File Structure

```
mobile/
├── ios/
│   └── DoItWidgets/              # iOS Widget Extension
│       ├── TodayWidget.swift
│       ├── NextTaskWidget.swift
│       ├── StatsWidget.swift
│       ├── SmartSuggestionsWidget.swift
│       ├── WidgetDataProvider.swift
│       ├── Info.plist
│       └── Assets.xcassets/
│
├── android/
│   └── app/
│       └── src/main/
│           ├── java/.../widgets/
│           │   ├── TodayWidget.kt
│           │   ├── NextTaskWidget.kt
│           │   ├── StatsWidget.kt
│           │   ├── SmartSuggestionsWidget.kt
│           │   └── WidgetDataProvider.kt
│           └── res/
│               ├── layout/
│               │   ├── widget_today_small.xml
│               │   ├── widget_today_medium.xml
│               │   └── ...
│               └── xml/
│                   └── widget_info.xml
│
└── src/
    └── services/
        └── widgetDataProvider.ts   # React Native service
```

---

## 🎯 Priority & Roadmap

### Phase 1: MVP (Week 1)
- [x] Architecture planning
- [ ] WidgetDataProvider service (RN)
- [ ] Today Widget (Small) - iOS
- [ ] Today Widget (Small) - Android
- [ ] Deep linking setup

### Phase 2: Core Widgets (Week 2)
- [ ] Today Widget (Medium, Large)
- [ ] Next Task Widget
- [ ] Stats Widget

### Phase 3: Advanced (Week 3)
- [ ] Smart Suggestions Widget
- [ ] Customization options
- [ ] Interactive buttons (Android)

### Phase 4: Polish (Week 4)
- [ ] Animations
- [ ] Error states
- [ ] Empty states
- [ ] Dark mode refinement

---

## 🎨 Mockups & Examples

### Today Widget - Small
```
┌─────────────┐
│ 🗓️ Aujourd'│
│             │
│ 📝 Faire    │
│    courses  │
│             │
│ 3 tâches    │
└─────────────┘
```

### Today Widget - Medium
```
┌────────────────────────────┐
│ 🗓️ Aujourd'hui    ●●●○○  │
│                            │
│ ☐ Faire les courses  10h  │
│ ☐ Réunion projet    14h30 │
│ ☐ Sport             18h   │
│                            │
│ 3/5 complétées             │
└────────────────────────────┘
```

### Next Task Widget - Small
```
┌─────────────┐
│ 🔴 URGENT   │
│             │
│ Réunion     │
│ projet      │
│             │
│ 🕐 14h30    │
└─────────────┘
```

### Stats Widget - Medium
```
┌────────────────────────────┐
│ 📊 Vos Stats               │
│                            │
│ 🔥 12    │ ✅ 5/8         │
│ Jours    │ Aujourd'hui    │
│                            │
│ ▁▃▂▅▇▆█ Cette semaine     │
└────────────────────────────┘
```

### Smart Suggestions Widget - Medium
```
┌────────────────────────────┐
│ 💡 Suggestions      🔴 2   │
│                            │
│ 🚗 Optimiser itinéraire    │
│    Économisez 2.5 km       │
│                            │
│ 📅 Reporter "Sport"        │
│    Météo: pluie prévue     │
│                            │
│ [Voir tout →]              │
└────────────────────────────┘
```

---

## ✅ Checklist de Développement

### Setup
- [ ] Créer Widget Extension (iOS)
- [ ] Ajouter App Group (iOS)
- [ ] Configurer manifest (Android)
- [ ] Setup deep linking

### Data Layer
- [ ] WidgetDataProvider service
- [ ] Shared storage setup
- [ ] Data sync logic
- [ ] Error handling

### UI Components
- [ ] Design system (colors, typography)
- [ ] Reusable components
- [ ] Dark mode support
- [ ] Accessibility labels

### Widgets
- [ ] Today Widget (all sizes)
- [ ] Next Task Widget
- [ ] Stats Widget
- [ ] Smart Suggestions Widget

### Testing
- [ ] Unit tests (data provider)
- [ ] Widget previews
- [ ] Dark mode testing
- [ ] Different screen sizes
- [ ] Empty states
- [ ] Error states

### Documentation
- [ ] Setup guide
- [ ] Widget customization guide
- [ ] Troubleshooting
- [ ] Screenshots

---

## 🎓 Best Practices

### Performance
- Cache widget data
- Minimize updates
- Efficient rendering
- Background task limits

### UX
- Clear, concise text
- Meaningful icons
- Visual hierarchy
- Touch targets (44pt iOS, 48dp Android)

### Accessibility
- VoiceOver support
- Large text support
- High contrast mode
- Descriptive labels

### Error Handling
- Graceful degradation
- Empty states
- Offline support
- Retry logic

---

## 📝 Notes

### iOS Limitations
- No animations in widgets
- No video
- No scroll views
- Limited interactions
- 15 min minimum update

### Android Advantages
- Interactive buttons
- Scroll views possible
- More flexible updates
- Material You theming

---

Cette architecture est prête à être implémentée ! 🚀
