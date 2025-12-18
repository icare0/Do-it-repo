/**
 * Subtask Manager Component
 * Complete subtask system with drag & drop, checkboxes, progress
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt?: Date;
}

interface SubtaskManagerProps {
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  editable?: boolean;
}

export function SubtaskManager({
  subtasks = [],
  onSubtasksChange,
  editable = true,
}: SubtaskManagerProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Calculate progress
  const completedCount = subtasks.filter(st => st.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Add new subtask
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: `subtask_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      order: subtasks.length,
      createdAt: new Date(),
    };

    onSubtasksChange([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Toggle subtask completion
  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onSubtasksChange(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Delete subtask
  const handleDeleteSubtask = (subtaskId: string) => {
    Alert.alert(
      'Supprimer',
      'Supprimer cette sous-tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const filtered = subtasks.filter(st => st.id !== subtaskId);
            onSubtasksChange(filtered);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  // Start editing
  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    const updated = subtasks.map(st =>
      st.id === editingId ? { ...st, title: editingTitle.trim() } : st
    );
    onSubtasksChange(updated);
    setEditingId(null);
    setEditingTitle('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Handle drag end (reorder)
  const handleDragEnd = ({ data }: { data: Subtask[] }) => {
    // Update order property
    const reordered = data.map((st, index) => ({ ...st, order: index }));
    onSubtasksChange(reordered);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Clear completed subtasks
  const handleClearCompleted = () => {
    const incomplete = subtasks.filter(st => !st.completed);
    if (completedCount === 0) return;

    Alert.alert(
      'Nettoyer',
      `Supprimer ${completedCount} sous-tâche(s) terminée(s) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onSubtasksChange(incomplete);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  // Render subtask item
  const renderSubtaskItem = ({ item, drag, isActive }: RenderItemParams<Subtask>) => {
    const isEditing = editingId === item.id;

    return (
      <ScaleDecorator>
        <Animated.View
          style={[
            styles.subtaskItem,
            {
              backgroundColor: isActive
                ? theme.colors.primaryLight
                : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Drag Handle */}
          {editable && (
            <TouchableOpacity
              onLongPress={drag}
              disabled={!editable}
              style={styles.dragHandle}
            >
              <Ionicons name="reorder-two" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}

          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => handleToggleSubtask(item.id)}
            style={[
              styles.checkbox,
              {
                borderColor: item.completed ? theme.colors.success : theme.colors.border,
                backgroundColor: item.completed ? theme.colors.success : 'transparent',
              },
            ]}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            )}
          </TouchableOpacity>

          {/* Title (editable or static) */}
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                value={editingTitle}
                onChangeText={setEditingTitle}
                onSubmitEditing={handleSaveEdit}
                onBlur={handleSaveEdit}
                autoFocus
                style={[
                  styles.editInput,
                  { color: theme.colors.text, borderColor: theme.colors.primary },
                ]}
                placeholder="Titre de la sous-tâche"
                placeholderTextColor={theme.colors.textTertiary}
              />
              <TouchableOpacity onPress={handleSaveEdit} style={styles.saveButton}>
                <Ionicons name="checkmark" size={20} color={theme.colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                <Ionicons name="close" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => editable && handleStartEdit(item)}
              style={styles.titleContainer}
            >
              <Text
                style={[
                  styles.subtaskTitle,
                  {
                    color: item.completed ? theme.colors.textTertiary : theme.colors.text,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                  },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}

          {/* Delete button */}
          {editable && !isEditing && (
            <TouchableOpacity
              onPress={() => handleDeleteSubtask(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="list" size={20} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Sous-tâches
          </Text>
          {totalCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {completedCount}/{totalCount}
              </Text>
            </View>
          )}
        </View>

        {completedCount > 0 && editable && (
          <TouchableOpacity onPress={handleClearCompleted} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.clearText, { color: theme.colors.textSecondary }]}>
              Nettoyer
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      {totalCount > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? theme.colors.success : theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}

      {/* Subtasks list */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {subtasks.length > 0 ? (
          <DraggableFlatList
            data={subtasks}
            renderItem={renderSubtaskItem}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
            activationDistance={editable ? 20 : 999999}
            containerStyle={styles.list}
            scrollEnabled={true}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucune sous-tâche
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
              Ajoutez des étapes pour décomposer cette tâche
            </Text>
          </View>
        )}
      </GestureHandlerRootView>

      {/* Add new subtask */}
      {editable && (
        <View style={[styles.addContainer, { borderTopColor: theme.colors.border }]}>
          <TextInput
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            onSubmitEditing={handleAddSubtask}
            placeholder="Ajouter une sous-tâche..."
            placeholderTextColor={theme.colors.textTertiary}
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            style={[
              styles.addButton,
              {
                backgroundColor: newSubtaskTitle.trim()
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  list: {
    paddingHorizontal: 16,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  dragHandle: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  subtaskTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  saveButton: {
    padding: 4,
  },
  cancelButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 12,
    borderRadius: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
