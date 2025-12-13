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
import { getTheme } from '@/theme';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';

const { width } = Dimensions.get('window');

export default function TaskDetailScreen() {
  const navigation = useNavigation();
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
      setTimeout(() => navigation.goBack(), 500);
    }
  }

  const Group = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <View style={styles.groupContainer}>
      {title && <Text style={[styles.groupTitle, { color: theme.colors.textSecondary }]}>{title}</Text>}
      <View style={[styles.group, { backgroundColor: theme.colors.card }]}>
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
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.detailLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>{value}</Text>
        {onPress && <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={{ marginLeft: 4 }} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
          <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          style={styles.headerButton}
        >
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <View style={[styles.titleContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity onPress={handleToggleComplete}>
                <Ionicons
                  name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                  size={28}
                  color={task.completed ? theme.colors.success : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.titleInput, { color: theme.colors.text }]}
              value={title}
              onChangeText={setTitle}
              onBlur={handleTitleBlur}
              placeholder="Titre de la tâche"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              scrollEnabled={false}
            />
          </View>

          {/* Details Group */}
          <Group title="DÉTAILS">
            <View style={styles.detailsContainer}>
              <DetailRow
                icon="calendar"
                label="Date"
                value={task.startDate ? format(new Date(task.startDate), 'd MMM yyyy', { locale: fr }) : 'Aucune'}
                color={theme.colors.primary}
                onPress={() => { /* TODO: Date Picker */ }}
              />
              <DetailRow
                icon="time"
                label="Heure"
                value={task.startDate ? format(new Date(task.startDate), 'HH:mm') : '--:--'}
                color={theme.colors.info}
                onPress={() => { /* TODO: Time Picker */ }}
              />
              <DetailRow
                icon="flag"
                label="Priorité"
                value={task.priority === 'high' ? 'Urgent' : task.priority === 'low' ? 'Faible' : 'Normal'}
                color={task.priority === 'high' ? theme.colors.error : theme.colors.warning}
                isLast
                onPress={() => {
                  const nextPriority = task.priority === 'low' ? 'medium' : task.priority === 'medium' ? 'high' : 'low';
                  handleUpdate({ priority: nextPriority });
                }}
              />
            </View>
          </Group>

          {/* Notes Group */}
          <Group title="NOTES">
            <TextInput
              style={[styles.notesInput, { color: theme.colors.text }]}
              value={description}
              onChangeText={setDescription}
              onBlur={handleDescriptionBlur}
              placeholder="Ajouter des notes..."
              placeholderTextColor={theme.colors.textSecondary}
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
                  style={[styles.mapOverlay, { backgroundColor: theme.colors.card }]}
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

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 12,
    zIndex: 10,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerButtonText: {
    fontSize: 17,
    marginLeft: 4,
  },
  content: {
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    paddingTop: 0,
  },
  groupContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  group: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailsContainer: {
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 58,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  },
  notesInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
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
    shadowRadius: 4,
    elevation: 3,
  },
  mapInfo: {
    flex: 1,
    marginRight: 12,
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  mapAddress: {
    fontSize: 13,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
