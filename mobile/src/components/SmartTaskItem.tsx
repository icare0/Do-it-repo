import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Task } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { Checkbox } from '@/components/ui/Checkbox';

interface SmartTaskItemProps {
    task: Task;
    onPress: (task: Task) => void;
    onToggle: (taskId: string) => void;
}

export const SmartTaskItem: React.FC<SmartTaskItemProps> = ({ task, onPress, onToggle }) => {
    const { colorScheme } = useThemeStore();
    const theme = getTheme(colorScheme);

    const isShoppingItem =
        task.category?.toLowerCase() === 'shopping' ||
        task.category?.toLowerCase() === 'courses' ||
        task.title.toLowerCase().includes('acheter') ||
        task.title.toLowerCase().includes('buy');

    const hasLocation = !!task.location;
    const hasDate = !!task.startDate;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onPress(task)}
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                },
                isShoppingItem && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }
            ]}
        >
            <View style={styles.content}>
                <Checkbox
                    checked={task.completed}
                    onPress={() => onToggle(task.id)}
                />

                <View style={styles.textContainer}>
                    <Text
                        style={[
                            styles.title,
                            { color: theme.colors.text },
                            task.completed && styles.completedText
                        ]}
                        numberOfLines={1}
                    >
                        {task.title}
                    </Text>

                    {(hasLocation || hasDate || isShoppingItem) && (
                        <View style={styles.metaContainer}>
                            {isShoppingItem && (
                                <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
                                    <Ionicons name="cart-outline" size={12} color={theme.colors.primary} />
                                    <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Courses</Text>
                                </View>
                            )}

                            {hasDate && task.startDate && (
                                <View style={[styles.badge, { backgroundColor: theme.colors.secondary + '20' }]}>
                                    <Ionicons name="calendar-outline" size={12} color={theme.colors.secondary} />
                                    <Text style={[styles.badgeText, { color: theme.colors.secondary }]}>
                                        {format(new Date(task.startDate), 'd MMM', { locale: fr })}
                                    </Text>
                                </View>
                            )}

                            {hasLocation && (
                                <View style={[styles.badge, { backgroundColor: theme.colors.accent + '20' }]}>
                                    <Ionicons name="location-outline" size={12} color={theme.colors.accent} />
                                    <Text style={[styles.badgeText, { color: theme.colors.accent }]}>
                                        {task.location?.name || 'Lieu'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.5 }}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    textContainer: {
        flex: 1,
        gap: 6,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.4,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
