import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions, Platform, StatusBar, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme, spacing, borderRadius } from '@/theme';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';

const { width } = Dimensions.get('window');

export default function TaskDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, updateTask, deleteTask, toggleTaskCompletion } = useTaskStore();
  const mapRef = useRef<MapView>(null);

  const taskId = (route.params as any)?.taskId;
  const task = tasks.find(t => t.id === taskId);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task]);

  if (!task) return null;

  const isDark = colorScheme === 'dark';

  const handleUpdate = (updates: any) => {
    updateTask(task.id, updates);
  };

  const handleTitleBlur = () => {
    if (title.trim() !== task.title) {
      handleUpdate({ title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description.trim() !== (task.description || '')) {
      handleUpdate({ description: description.trim() });
    }
  };

  async function handleDelete() {
    Alert.alert('Supprimer', 'Êtes-vous sûr de vouloir supprimer cette tâche ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await database.write(async () => {
            const dbTask = await database.get<TaskModel>('tasks').find(task.id);
            await dbTask.markAsDeleted();
          });
          await syncService.addToSyncQueue('task', task.id, 'delete', {});
          deleteTask(task.id);
          navigation.goBack();
        },
      },
    ]);
  }

  async function handleToggleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await toggleTaskCompletion(task.id);
    if (!task.completed) {
      navigation.goBack();
    }
  }

  function handleStartFocus() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('FocusMode', { taskTitle: task?.title });
  }

  const Group = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <View style={styles.groupContainer}>
      {title && <Text style={[styles.groupTitle, { color: theme.colors.textTertiary }]}>{title}</Text>}
      <View style={[styles.group, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
        {children}
      </View>
    </View>
  );

  const DetailRow = ({ icon, label, value, color, isLast, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.detailRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: color ? color + '15' : theme.colors.backgroundTertiary }]}>
        <Ionicons name={icon} size={20} color={color || theme.colors.textSecondary} />
      </View>
      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
        {onPress && <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} style={{ marginLeft: 4 }} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.content]} showsVerticalScrollIndicator={false}>

          {/* HERO SECTION: Title & Status */}
          <View style={styles.heroSection}>
            <View style={styles.titleRow}>
              <TextInput
                style={[styles.titleInput, { color: theme.colors.text }]}
                value={title}
                onChangeText={setTitle}
                onBlur={handleTitleBlur}
                placeholder="Titre de la tâche"
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                scrollEnabled={false}
              />
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  { backgroundColor: task.completed ? theme.colors.success : theme.colors.border }
                ]}
                onPress={handleToggleComplete}
              >
                <Ionicons name="checkmark" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Bar */}
            <View style={styles.quickActionsBar}>
              <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.colors.surface }]} onPress={() => { }}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>
                  {task.startDate ? format(new Date(task.startDate), 'd MMM') : 'Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
                onPress={() => {
                  const next = task.priority === 'low' ? 'medium' : task.priority === 'medium' ? 'high' : 'low';
                  handleUpdate({ priority: next });
                  Haptics.selectionAsync();
                }}
              >
                <Ionicons name="flag-outline" size={20} color={task.priority === 'high' ? theme.colors.error : theme.colors.warning} />
                <Text style={[styles.quickActionText, { color: task.priority === 'high' ? theme.colors.error : theme.colors.warning }]}>
                  {task.priority === 'high' ? 'Urgent' : task.priority === 'low' ? 'Faible' : 'Normal'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Details Group */}
          <Group title="INFORMATIONS">
            <DetailRow
              icon="time-outline"
              label="Heure"
              value={task.startDate ? format(new Date(task.startDate), 'HH:mm') : 'Toute la journée'}
              color={theme.colors.info}
              onPress={() => { }}
            />
            <DetailRow
              icon="folder-open-outline"
              label="Catégorie"
              value={task.category || 'Aucune'}
              color={theme.colors.secondary}
              isLast
              onPress={() => { }}
            />
          </Group>

          {/* Notes Group */}
          <Group title="NOTES">
            <TextInput
              style={[styles.notesInput, { color: theme.colors.text }]}
              value={description}
              onChangeText={setDescription}
              onBlur={handleDescriptionBlur}
              placeholder="Ajouter des détails, sous-tâches..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              scrollEnabled={false}
            />
          </Group>

          {/* Location Map */}
          {task.location && task.location.latitude && task.location.longitude && (
            <Group title="LIEU">
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: task.location.latitude,
                    longitude: task.location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: task.location.latitude,
                      longitude: task.location.longitude,
                    }}
                  />
                </MapView>
                <TouchableOpacity
                  style={[styles.mapOverlay, { backgroundColor: theme.colors.surface }]}
                  onPress={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${task.location!.latitude},${task.location!.longitude}`;
                    Alert.alert('Itinéraire', 'Ouverture de l\'itinéraire...');
                  }}
                >
                  <View style={styles.mapInfo}>
                    <Text style={[styles.mapTitle, { color: theme.colors.text }]}>{task.location.name}</Text>
                    {task.location.address && (
                      <Text style={[styles.mapAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                        {task.location.address}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.navButton, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="navigate" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </Group>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Action Footer */}
      {!task.completed && (
        <View style={[styles.footer, {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: insets.bottom + 16
        }]}>
          <Button
            title="Démarrer Focus"
            onPress={handleStartFocus}
            size="large"
            icon={<Ionicons name="play" size={20} color="#FFF" style={{ marginRight: 8 }} />}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  titleInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingTop: 0,
    lineHeight: 34,
  },
  statusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsBar: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  group: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 16,
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mapInfo: {
    flex: 1,
    marginRight: 12,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapAddress: {
    fontSize: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
