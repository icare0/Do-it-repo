import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';

const { width } = Dimensions.get('window');

export default function TaskDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, updateTask, deleteTask, toggleTaskCompletion } = useTaskStore();
  const mapRef = useRef<MapView>(null);

  const taskId = (route.params as any)?.taskId;
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return null;
  }

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
    await toggleTaskCompletion(task.id);
    // Automatically go back after marking as complete
    if (!task.completed) {
      setTimeout(() => {
        navigation.goBack();
      }, 300);
    }
  }

  function getPriorityColor() {
    switch (task.priority) {
      case 'high':
        return theme.colors.error;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.warning;
    }
  }

  function getPriorityLabel() {
    switch (task.priority) {
      case 'high':
        return 'Haute';
      case 'low':
        return 'Basse';
      default:
        return 'Moyenne';
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <IconButton
          icon={<Ionicons name="arrow-back" size={24} color={theme.colors.text} />}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerActions}>
          <IconButton
            icon={<Ionicons name="create-outline" size={24} color={theme.colors.text} />}
            onPress={() => {
              // TODO: Navigate to edit screen
              Alert.alert('Modification', 'Fonctionnalité à venir');
            }}
          />
          <IconButton
            icon={<Ionicons name="trash-outline" size={24} color={theme.colors.error} />}
            onPress={handleDelete}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{task.title}</Text>
          {task.completed && (
            <View style={[styles.completedBadge, { backgroundColor: `${theme.colors.success}15` }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={[styles.completedText, { color: theme.colors.success }]}>Terminée</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {task.description && (
          <Card variant="flat" style={styles.descriptionCard}>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {task.description}
            </Text>
          </Card>
        )}

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          {/* Date & Time */}
          {task.startDate && (
            <Card variant="elevated" style={styles.infoCard}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date & Heure</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {format(task.startDate, 'EEEE d MMMM', { locale: fr })}
                </Text>
                <Text style={[styles.infoSubValue, { color: theme.colors.textSecondary }]}>
                  {format(task.startDate, 'HH:mm')}
                </Text>
              </View>
            </Card>
          )}

          {/* Priority */}
          <Card variant="elevated" style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: `${getPriorityColor()}15` }]}>
              <Ionicons name="flag" size={24} color={getPriorityColor()} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Priorité</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {getPriorityLabel()}
              </Text>
            </View>
          </Card>

          {/* Category */}
          {task.category && (
            <Card variant="elevated" style={styles.infoCard}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.secondary}15` }]}>
                <Ionicons name="pricetag" size={24} color={theme.colors.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Catégorie</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {task.category}
                </Text>
              </View>
            </Card>
          )}

          {/* Duration */}
          {task.duration && (
            <Card variant="elevated" style={styles.infoCard}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.info}15` }]}>
                <Ionicons name="time" size={24} color={theme.colors.info} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Durée</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {task.duration >= 60
                    ? `${Math.floor(task.duration / 60)}h ${task.duration % 60 > 0 ? `${task.duration % 60}min` : ''}`
                    : `${task.duration} min`}
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Location Map */}
        {task.location && (
          <Card variant="elevated" style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.warning}15` }]}>
                <Ionicons name="location" size={24} color={theme.colors.warning} />
              </View>
              <View style={styles.mapHeaderText}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Lieu</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {task.location.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.directionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  // Open directions in maps app
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${task.location!.latitude},${task.location!.longitude}`;
                  Alert.alert('Itinéraire', 'Ouverture de l\'itinéraire...');
                }}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: task.location.latitude,
                  longitude: task.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: task.location.latitude,
                    longitude: task.location.longitude,
                  }}
                  title={task.location.name}
                />
              </MapView>
            </View>

            {task.location.address && (
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
                  {task.location.address}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Recurring Pattern */}
        {task.recurringPattern && (
          <Card variant="elevated" style={styles.recurringCard}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <Ionicons name="repeat" size={24} color={theme.colors.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Récurrence</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {task.recurringPattern.frequency === 'daily' && 'Quotidien'}
                {task.recurringPattern.frequency === 'weekly' && 'Hebdomadaire'}
                {task.recurringPattern.frequency === 'monthly' && 'Mensuel'}
                {task.recurringPattern.frequency === 'yearly' && 'Annuel'}
              </Text>
            </View>
          </Card>
        )}

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Complete Button */}
      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Button
          title={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
          onPress={handleToggleComplete}
          variant={task.completed ? 'outline' : 'primary'}
          fullWidth
          icon={
            <Ionicons
              name={task.completed ? 'close-circle-outline' : 'checkmark-circle'}
              size={20}
              color={task.completed ? theme.colors.text : '#fff'}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionCard: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoGrid: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 14,
  },
  mapCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  mapHeaderText: {
    flex: 1,
  },
  directionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 200,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
  },
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});
