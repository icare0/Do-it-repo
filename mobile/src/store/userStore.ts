import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInCalendarDays } from 'date-fns';

interface UserState {
    points: number;
    level: number;
    streak: number;
    lastActiveDate: string | null;

    addPoints: (amount: number) => void;
    updateStreak: () => void;
    resetProgress: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            points: 0,
            level: 1,
            streak: 0,
            lastActiveDate: null,

            addPoints: (amount) => {
                const { points, level } = get();
                const newPoints = points + amount;
                // Simple level up logic: Level up every 100 points * current level
                const pointsForNextLevel = level * 100;

                if (newPoints >= pointsForNextLevel) {
                    set({ points: newPoints - pointsForNextLevel, level: level + 1 });
                } else {
                    set({ points: newPoints });
                }
            },

            updateStreak: () => {
                const { lastActiveDate, streak } = get();
                const today = new Date().toISOString().split('T')[0];

                if (lastActiveDate === today) {
                    return; // Already updated today
                }

                if (lastActiveDate) {
                    const daysDiff = differenceInCalendarDays(new Date(today), new Date(lastActiveDate));

                    if (daysDiff === 1) {
                        // Consecutive day
                        set({ streak: streak + 1, lastActiveDate: today });
                    } else if (daysDiff > 1) {
                        // Streak broken
                        set({ streak: 1, lastActiveDate: today });
                    } else {
                        // Should not happen (future date?), but just update date
                        set({ lastActiveDate: today });
                    }
                } else {
                    // First time
                    set({ streak: 1, lastActiveDate: today });
                }
            },

            resetProgress: () => {
                set({ points: 0, level: 1, streak: 0, lastActiveDate: null });
            },
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
