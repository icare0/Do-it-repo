import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolateColor,
    useDerivedValue
} from 'react-native-reanimated';

import { Task } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

const { width } = Dimensions.get('window');

import { SwipeableRow } from './ui/SwipeableRow';

interface PremiumTaskItemProps {
    task: Task;
    onPress: (task: Task) => void;
    onToggle: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
}

export const PremiumTaskItem: React.FC<PremiumTaskItemProps> = ({ task, onPress, onToggle, onDelete }) => {
    const { colorScheme } = useThemeStore();
    const theme = getTheme(colorScheme);

    // Animation values
    const scale = useSharedValue(1);
    const completedProgress = useSharedValue(task.completed ? 1 : 0);

    useEffect(() => {
        completedProgress.value = withSpring(task.completed ? 1 : 0, {
            damping: 20,
            stiffness: 100
        });
    }, [task.completed]);

    const handlePress = () => {
        scale.value = withSpring(0.95, {}, () => {
            scale.value = withSpring(1);
        });
        onPress(task);
    };

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle(task.id);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const checkmarkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: completedProgress.value }],
        opacity: completedProgress.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: withTiming(task.completed ? 0.5 : 1),
    }));

    // Smart detection
    const isShopping =
        task.category?.toLowerCase() === 'shopping' ||
        task.category?.toLowerCase() === 'courses' ||
        task.title.toLowerCase().includes('acheter') ||
        task.title.toLowerCase().includes('buy');

    const priorityColor = {
        high: theme.colors.error,
        medium: theme.colors.warning,
        low: theme.colors.success
    }[task.priority] || theme.colors.primary;

    const accentColor = isShopping ? theme.colors.primary : priorityColor;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <SwipeableRow
                style={{ borderRadius: 20, overflow: 'hidden' }}
                leftAction={{
                    icon: task.completed ? 'arrow-undo' : 'checkmark-circle',
                    color: '#fff',
                    gradient: task.completed ? ['#F59E0B', '#FCD34D'] : ['#10B981', '#6EE7B7'],
                    onPress: () => onToggle(task.id),
                    label: task.completed ? 'À faire' : 'Terminer',
                }}
                rightAction={onDelete ? {
                    icon: 'trash',
                    color: '#fff',
                    gradient: ['#EF4444', '#F87171'],
                    onPress: () => onDelete(task.id),
                    label: 'Supprimer',
                } : undefined}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={handlePress}
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.colors.surface,
                            shadowColor: '#000',
                        }
                    ]}
                >
                    {/* Left Accent Strip */}
                    <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

                    <View style={styles.content}>
                        {/* Checkbox Area */}
                        <TouchableOpacity
                            onPress={handleToggle}
                            style={[styles.checkboxContainer, { borderColor: theme.colors.border }]}
                        >
                            <Animated.View style={[styles.checkboxFill, { backgroundColor: accentColor }, checkmarkStyle]}>
                                <Ionicons name="checkmark" size={14} color="#FFF" />
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Main Content */}
                        <View style={styles.mainInfo}>
                            <View style={styles.headerRow}>
                                <Animated.Text
                                    style={[
                                        styles.title,
                                        { color: theme.colors.text },
                                        textStyle
                                    ]}
                                    numberOfLines={1}
                                >
                                    {task.title}
                                </Animated.Text>
                                {task.category && (
                                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.surface }]}>
                                        <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
                                            {task.category}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Metadata Row */}
                            <View style={styles.metaRow}>
                                {task.startDate && (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                                        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                                            {format(new Date(task.startDate), 'd MMM', { locale: fr })}
                                        </Text>
                                    </View>
                                )}

                                {task.location && (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                                        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                                            {task.location.name}
                                        </Text>
                                    </View>
                                )}

                                {isShopping && (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="cart-outline" size={14} color={theme.colors.primary} />
                                        <Text style={[styles.metaText, { color: theme.colors.primary, fontWeight: '600' }]}>
                                            Courses
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Chevron */}
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.colors.textSecondary}
                            style={{ opacity: 0.3 }}
                        />
                    </View>
                </TouchableOpacity>
            </SwipeableRow>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        marginHorizontal: 4,
    },
    card: {
        borderRadius: 20,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        minHeight: 80,
    },
    accentStrip: {
        width: 6,
        height: '100%',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    checkboxContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    checkboxFill: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainInfo: {
        flex: 1,
        gap: 6,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.3,
        flex: 1,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
    },
});
