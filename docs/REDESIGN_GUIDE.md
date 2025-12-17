# 🎨 Guide de Refonte Design Apple-like - Do-it App

## ✅ Travail Complété

### 1. Design System Complet (mobile/src/theme/)

#### **Couleurs Apple-inspired** (`colors.ts`)
- ✅ Palette complète iOS (SF Colors)
- ✅ Couleurs système: Blue, Purple, Pink, Teal, Green, Yellow, Orange, Red, Indigo
- ✅ Variantes Soft pour chaque couleur (backgrounds pastels)
- ✅ Couleurs catégorielles: Work, Personal, Shopping, Health, Finance, Learning, Social, Travel
- ✅ Couleurs de priorité: High, Medium, Low (avec variantes soft)
- ✅ Gradients Apple-style (Primary, Secondary, Sunrise, Ocean, Forest, Sunset, Midnight)
- ✅ Glass morphism colors
- ✅ Support dark mode complet
- ✅ Helpers: `getCategoryColor()`, `getCategorySoftColor()`, `getPriorityColor()`, `getPrioritySoftColor()`

#### **Typographie SF Pro** (`typography.ts`)
- ✅ iOS Human Interface Guidelines
- ✅ Large Title (34pt) pour les navigation bars
- ✅ Titles (Title1, Title2, Title3)
- ✅ Headline (17pt, semibold)
- ✅ Body (17pt, regular)
- ✅ Callout (16pt)
- ✅ Subheadline (15pt)
- ✅ Footnote (13pt)
- ✅ Caption (12pt, 11pt)
- ✅ Letter spacing Apple-style

#### **Spacing & Dimensions** (`spacing.ts`)
- ✅ Spacing: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- ✅ Border radius: 6, 10, 12, 16, 20, 24, 28
- ✅ Shadows très subtiles (Apple-style)
- ✅ Icon sizes: 12-48px
- ✅ Avatar sizes: 24-80px
- ✅ Hit slop pour accessibilité (44x44pt minimum)
- ✅ Animation durations (200ms - 600ms)

### 2. Composants UI Refaits (mobile/src/components/ui/)

#### **Button** (`Button.tsx`)
- ✅ Variantes: primary, secondary, outline, ghost, destructive, tinted, **glass**
- ✅ Sizes: small, medium, large
- ✅ Glass morphism variant avec BlurView
- ✅ Gradient support
- ✅ Icon support (left/right)
- ✅ Loading states
- ✅ Disabled states
- ✅ Hit slop configuré
- ✅ Active opacity animations

#### **Card** (`Card.tsx`)
- ✅ Variantes: default, elevated, **glass**, **gradient**, flat
- ✅ Glass morphism avec BlurView
- ✅ Gradient backgrounds
- ✅ Pressable avec animations (scale 0.98)
- ✅ onPress & onLongPress support
- ✅ Padding & border radius configurables
- ✅ SectionCard component pour iOS Settings style

#### **Input** (`Input.tsx`)
- ✅ Variantes: default, filled, outline
- ✅ Sizes: small, medium, large
- ✅ Focus state amélioré (animated border)
- ✅ Clear button avec animation
- ✅ Left & right icons support
- ✅ Error & helper text
- ✅ SearchInput variant avec icône recherche

#### **Badge** (`Badge.tsx`)
- ✅ Variantes: default, primary, success, error, warning, info
- ✅ **CategoryBadge** avec icônes (briefcase, person, cart, etc.)
- ✅ **PriorityBadge** avec icônes (arrow-up, arrow-down, remove)
- ✅ **StatusBadge** (completed/en cours)
- ✅ Dot indicator option
- ✅ Icon support
- ✅ Sizes: small, medium, large

### 3. TodayScreen Redesign (`mobile/src/screens/TodayScreen.tsx`)

#### **Header**
- ✅ **Large Title animé** style iOS (disparaît au scroll)
- ✅ **Compact Header** qui apparaît au scroll (avec opacity animation)
- ✅ Greeting contextuel (Bonjour/Bon après-midi/Bonsoir)
- ✅ Date formatée en français avec capitalize
- ✅ Streak badge cliquable
- ✅ Notification badge avec dot indicator

#### **Progress Card**
- ✅ **Circular Progress** avec gradient
- ✅ Card elevated avec padding généreux
- ✅ Progress percentage centré
- ✅ Texte "X sur Y terminées"

#### **Sections**
- ✅ Headers en **MAJUSCULES** style iOS Settings
- ✅ Count badges (nombre de tâches)
- ✅ Spacing généreux entre sections

#### **Task Cards**
- ✅ Cards elevated avec shadow subtile
- ✅ Swipe actions (Demain / Supprimer) avec couleurs
- ✅ Checkbox custom
- ✅ **CategoryBadge** avec icônes colorés
- ✅ Priority dot indicator (petit point rouge pour high priority)
- ✅ Meta info: time, location avec icons
- ✅ Description text (si présente)
- ✅ Animations au press (Pressable)

#### **Empty States**
- ✅ Icône dans un cercle coloré
- ✅ Titre + description
- ✅ Design encourageant

#### **FAB (Floating Action Button)**
- ✅ Gradient background
- ✅ Shadow XL
- ✅ Position bottom-right
- ✅ Active opacity animation

#### **Animations**
- ✅ Scroll-based header animation
- ✅ RefreshControl avec tint color
- ✅ Smooth transitions

---

## 🚀 Comment Continuer la Refonte

### Screens Prioritaires à Refaire

#### 1. **QuickAddScreen** (mobile/src/screens/QuickAddScreen.tsx)
**État actuel**: Bon fonctionnellement, design à améliorer

**Améliorations à faire**:
- [ ] Remplacer l'input par un grand TextInput multiline style iOS Notes
- [ ] Ajouter glass morphism pour le conteneur de parsing
- [ ] Utiliser le nouveau Badge component pour les catégories
- [ ] Améliorer l'enrichment banner avec animation
- [ ] Footer avec Button refait (gradient)
- [ ] Animation d'apparition des parsed items

**Structure recommandée**:
```tsx
<SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
  {/* Header avec Large Title */}
  <View style={styles.header}>
    <Text style={[styles.largeTitle, { color: theme.colors.text }]}>
      Nouvelle tâche
    </Text>
    <TouchableOpacity onPress={goBack}>
      <Ionicons name="close-circle" size={32} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  </View>

  <ScrollView>
    {/* Input zone avec glass morphism */}
    <Card variant="glass" padding="xl">
      <TextInput
        multiline
        placeholder="Décrivez votre tâche..."
        style={styles.largeInput}
      />
    </Card>

    {/* Parsed results avec CategoryBadge */}
    {parsedTask && (
      <Card variant="elevated" padding="lg">
        <Text style={styles.sectionTitle}>DÉTECTÉ AUTOMATIQUEMENT</Text>
        <View style={styles.badgeContainer}>
          {parsedTask.category && <CategoryBadge category={parsedTask.category} />}
          {parsedTask.priority && <PriorityBadge priority={parsedTask.priority} />}
        </View>
      </Card>
    )}

    {/* Examples avec icônes */}
  </ScrollView>

  {/* Footer avec gradient Button */}
  <View style={styles.footer}>
    <Button
      title="Créer la tâche"
      variant="primary"
      size="large"
      fullWidth
      onPress={handleCreate}
    />
  </View>
</SafeAreaView>
```

#### 2. **TaskListScreen** (mobile/src/screens/TaskListScreen.tsx)
**Inspirations iOS**: Reminders app

**Améliorations**:
- [ ] Large Title avec animation
- [ ] Search bar en haut (SearchInput)
- [ ] Filtres avec horizontal ScrollView de badges
- [ ] Grouped sections par date
- [ ] Swipe actions
- [ ] Empty state design

**Structure**:
```tsx
{/* Large Title Header */}
<View style={styles.header}>
  <Text style={styles.largeTitle}>Toutes les tâches</Text>
  <SearchInput value={search} onChangeText={setSearch} onClear={handleClear} />
</View>

{/* Filter chips */}
<ScrollView horizontal style={styles.filterBar}>
  <Badge label="Toutes" variant={filter === 'all' ? 'primary' : 'default'} />
  <CategoryBadge category="work" />
  <CategoryBadge category="personal" />
  {/* etc */}
</ScrollView>

{/* Grouped Tasks */}
<SectionList
  sections={groupedTasks}
  renderSectionHeader={({ section }) => (
    <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
  )}
  renderItem={({ item }) => (
    <SwipeableRow>
      <Card variant="elevated">
        {/* Task content */}
      </Card>
    </SwipeableRow>
  )}
/>
```

#### 3. **CalendarScreen** (mobile/src/screens/CalendarScreen.tsx)
**Inspirations iOS**: Calendar app

**Améliorations**:
- [ ] Header avec mois/année
- [ ] Calendrier mensuel custom avec dots pour les jours avec tâches
- [ ] Liste des tâches du jour sélectionné
- [ ] Transitions fluides

#### 4. **TaskDetailScreen** (mobile/src/screens/TaskDetailScreen.tsx)
**Inspirations iOS**: Modal presentation

**Améliorations**:
- [ ] Modal presentation style (slide from bottom)
- [ ] Header avec titre et boutons
- [ ] Sections avec SectionCard
- [ ] Toggle switches style iOS
- [ ] Date/time pickers avec modal
- [ ] Location avec MapView preview
- [ ] Delete button en rouge en bas

**Sections**:
```tsx
<ScrollView>
  {/* Title */}
  <Input
    label="Titre"
    value={title}
    onChangeText={setTitle}
    variant="filled"
  />

  {/* Category */}
  <SectionCard title="CATÉGORIE">
    <ScrollView horizontal>
      <CategoryBadge category="work" onPress={() => setCategory('work')} />
      {/* etc */}
    </ScrollView>
  </SectionCard>

  {/* Priority */}
  <SectionCard title="PRIORITÉ">
    <PriorityBadge priority="high" onPress={() => setPriority('high')} />
    {/* etc */}
  </SectionCard>

  {/* Date & Time */}
  <SectionCard title="DATE ET HEURE">
    <Pressable onPress={showDatePicker}>
      <View style={styles.row}>
        <Ionicons name="calendar" />
        <Text>{formatDate(startDate)}</Text>
      </View>
    </Pressable>
  </SectionCard>

  {/* Location */}
  <SectionCard title="LIEU">
    {/* Map preview + address */}
  </SectionCard>

  {/* Delete */}
  <Button
    title="Supprimer la tâche"
    variant="destructive"
    onPress={handleDelete}
  />
</ScrollView>
```

#### 5. **MapScreen** (mobile/src/screens/MapScreen.tsx)
**Inspirations iOS**: Find My / Maps

**Améliorations**:
- [ ] Full screen map
- [ ] Custom markers avec CategoryBadge colors
- [ ] Bottom sheet avec task list
- [ ] Cluster markers
- [ ] Current location button (FAB)

#### 6. **SettingsScreen** (mobile/src/screens/SettingsScreen.tsx)
**Inspirations iOS**: Settings app (le plus important!)

**Structure iOS Settings**:
```tsx
<ScrollView style={styles.container}>
  {/* Profile Section */}
  <Card variant="elevated" padding="lg">
    <View style={styles.profileRow}>
      <Avatar size="xl" source={userAvatar} />
      <View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
      </View>
    </View>
  </Card>

  {/* Sections with SectionCard */}
  <SectionCard title="GÉNÉRAL">
    <SettingsRow
      icon="moon"
      label="Thème sombre"
      rightComponent={<Switch value={darkMode} onValueChange={setDarkMode} />}
    />
    <SettingsRow
      icon="language"
      label="Langue"
      value="Français"
      onPress={showLanguagePicker}
    />
  </SectionCard>

  <SectionCard title="NOTIFICATIONS">
    <SettingsRow
      icon="notifications"
      label="Activer les notifications"
      rightComponent={<Switch value={notifs} onValueChange={setNotifs} />}
    />
  </SectionCard>

  <SectionCard title="COMPTE">
    <SettingsRow icon="person" label="Profil" onPress={goToProfile} />
    <SettingsRow icon="lock-closed" label="Confidentialité" onPress={goToPrivacy} />
    <SettingsRow icon="log-out" label="Déconnexion" onPress={handleLogout} destructive />
  </SectionCard>
</ScrollView>
```

**SettingsRow Component à créer**:
```tsx
interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  rightComponent?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  rightComponent,
  onPress,
  destructive,
}) => {
  return (
    <Pressable
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress && !rightComponent}
    >
      <View style={styles.left}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <Text style={[styles.label, destructive && { color: theme.colors.error }]}>
          {label}
        </Text>
      </View>
      <View style={styles.right}>
        {value && <Text style={styles.value}>{value}</Text>}
        {rightComponent || <Ionicons name="chevron-forward" size={20} />}
      </View>
    </Pressable>
  );
};
```

---

## 🎨 Guidelines de Design

### Couleurs
- **Backgrounds**: Utiliser `theme.colors.background` pour le fond principal
- **Cards**: Préférer `variant="elevated"` avec shadows subtiles
- **Accents**: Utiliser les gradients pour les CTA importants
- **Categories**: Toujours utiliser `CategoryBadge` pour une cohérence visuelle

### Typographie
- **Titres principaux**: `typography.largeTitle` (34pt)
- **Section headers**: `typography.caption1Emphasized` en MAJUSCULES
- **Body text**: `typography.body` (17pt)
- **Meta info**: `typography.caption1` (12pt)

### Spacing
- **Entre sections**: `spacing.xxxl` (32px)
- **Entre cards**: `spacing.md` (12px)
- **Padding cards**: `spacing.lg` (16px) ou `spacing.xl` (20px)
- **Padding screen**: `spacing.xl` (20px)

### Animations
- **Duration**: 300ms pour la plupart des animations
- **Spring**: Pour les animations naturelles (damping: 15, stiffness: 150)
- **Opacity**: Pour les fades (0.6 active opacity)

### Dark Mode
- Toujours utiliser `theme.colors.xxx` (jamais de couleurs hardcodées)
- Tester en dark mode systématiquement

---

## 📦 Composants Manquants à Créer

### 1. **SettingsRow** (mentionné ci-dessus)
Pour l'écran Settings

### 2. **DateTimePicker**
Modal iOS-style pour sélection de date/heure
```tsx
<DateTimePickerModal
  visible={showPicker}
  mode="datetime"
  value={selectedDate}
  onConfirm={handleConfirm}
  onCancel={() => setShowPicker(false)}
  accentColor={theme.colors.primary}
/>
```

### 3. **ActionSheet**
Pour les choix multiples (catégorie, priorité, etc.)
```tsx
<ActionSheet
  visible={showActions}
  options={[
    { label: 'Travail', icon: 'briefcase', onPress: () => setCategory('work') },
    { label: 'Personnel', icon: 'person', onPress: () => setCategory('personal') },
    // ...
  ]}
  onCancel={() => setShowActions(false)}
/>
```

### 4. **BottomSheet**
Pour MapScreen et autres
```tsx
<BottomSheet
  visible={showSheet}
  snapPoints={['25%', '50%', '90%']}
  onClose={() => setShowSheet(false)}
>
  {/* Content */}
</BottomSheet>
```

### 5. **Avatar**
Pour le profil
```tsx
<Avatar
  size="xl"
  source={{ uri: userAvatar }}
  fallback={<Text>{userInitials}</Text>}
/>
```

---

## 🎯 Prochaines Étapes Recommandées

1. **Refaire QuickAddScreen** (1-2h)
   - C'est un écran crucial pour l'UX
   - Améliorer visuellement le parsing NLP

2. **Refaire TaskDetailScreen** (2-3h)
   - Modal presentation
   - Toutes les fonctionnalités (date, location, category, etc.)

3. **Refaire SettingsScreen** (2h)
   - Créer SettingsRow component
   - Style iOS Settings app

4. **Refaire TaskListScreen** (1-2h)
   - SearchInput
   - Filters avec badges
   - Grouped sections

5. **Refaire CalendarScreen** (2-3h)
   - Custom calendar component
   - Task list pour le jour sélectionné

6. **Refaire MapScreen** (2-3h)
   - Custom markers
   - Bottom sheet avec tasks

7. **Créer StatsScreen** (2h) - nouveau!
   - Afficher les streaks avec animations
   - Heatmap de completion
   - Graphiques avec react-native-chart-kit

---

## 🔧 Outils et Dépendances

### Installées et utilisées
- ✅ `expo-linear-gradient` (gradients)
- ✅ `expo-blur` (glass morphism)
- ✅ `@react-native-community/datetimepicker` (date picker)
- ✅ `react-native-maps` (maps)
- ✅ `date-fns` (date formatting)

### À installer si besoin
- `react-native-chart-kit` (graphiques pour Stats)
- `react-native-reanimated` (animations avancées)
- `@gorhom/bottom-sheet` (bottom sheet)

---

## 📝 Notes Importantes

### ❌ Ce qu'il NE FAUT PAS faire
- Ne pas hardcoder les couleurs (toujours utiliser `theme.colors.xxx`)
- Ne pas oublier le dark mode
- Ne pas créer de nouveaux composants si un existe déjà
- Ne pas utiliser des border radius excessifs (max 24px)

### ✅ Best Practices
- Utiliser `Pressable` au lieu de `TouchableOpacity` pour les press animations
- Utiliser `CategoryBadge` et `PriorityBadge` partout où applicable
- Espacer généreusement (Apple aime l'espace blanc)
- Shadows très subtiles (Apple n'aime pas les ombres fortes)
- Animations fluides et naturelles (spring physics)

---

## 🚢 Prêt pour Production

### Checklist avant de merger
- [ ] Tous les screens refaits
- [ ] Dark mode testé partout
- [ ] Animations fluides
- [ ] Pas de couleurs hardcodées
- [ ] Accessibilité (hit slop, contrast)
- [ ] Performance (pas de lag au scroll)
- [ ] Tests sur iOS et Android
- [ ] Onboarding gardé (demandé par le user)

---

## 📸 Références Visuelles

Pour l'inspiration, référez-vous aux apps iOS natives :
- **Reminders** (pour TaskList et TodayScreen)
- **Calendar** (pour CalendarScreen)
- **Find My** (pour MapScreen)
- **Settings** (pour SettingsScreen)
- **Notes** (pour QuickAddScreen et TaskDetail)
- **Health** (pour StatsScreen avec graphiques)

---

## 🎉 Résumé

Vous avez maintenant :
- ✅ Un design system complet Apple-like
- ✅ 4 composants UI refaits (Button, Card, Input, Badge)
- ✅ TodayScreen complètement refait avec animations
- ✅ Des guidelines claires pour continuer
- ✅ Des exemples de code pour chaque screen

**Temps estimé pour finir**: 10-15h pour refaire tous les screens restants

**Priorité**: QuickAddScreen → TaskDetailScreen → SettingsScreen → TaskListScreen → CalendarScreen → MapScreen → StatsScreen (nouveau)

Bon courage ! Le plus dur (design system) est fait, maintenant c'est de l'application systématique des patterns. 🚀
