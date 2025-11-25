import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStats extends Document {
  userId: string;

  // 🔥 STREAKS (séries) - FEATURE PRINCIPALE
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: Date;

  // 📊 Statistiques de tâches
  totalTasksCompleted: number;
  totalTasksCreated: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;

  // ⚡ Performance
  averageCompletionTime: number; // en heures
  onTimeCompletionRate: number; // pourcentage

  // 📁 Catégories explorées
  categoriesUsed: string[];

  // 📅 Activité
  daysActive: number;
  lastActiveDate: Date;

  // 🏆 Records personnels
  bestDay?: {
    date: Date;
    tasksCompleted: number;
  };
  bestWeek?: {
    startDate: Date;
    tasksCompleted: number;
  };

  // 📈 Historique de complétion (pour graphique de streak)
  completionHistory: Array<{
    date: Date;
    tasksCompleted: number;
  }>;
}

const userStatsSchema = new Schema<IUserStats>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Streaks
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: {
      type: Date,
    },

    // Statistiques
    totalTasksCompleted: {
      type: Number,
      default: 0,
    },
    totalTasksCreated: {
      type: Number,
      default: 0,
    },
    tasksCompletedToday: {
      type: Number,
      default: 0,
    },
    tasksCompletedThisWeek: {
      type: Number,
      default: 0,
    },
    tasksCompletedThisMonth: {
      type: Number,
      default: 0,
    },

    // Performance
    averageCompletionTime: {
      type: Number,
      default: 0,
    },
    onTimeCompletionRate: {
      type: Number,
      default: 100,
    },

    // Catégories
    categoriesUsed: {
      type: [String],
      default: [],
    },

    // Activité
    daysActive: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },

    // Records
    bestDay: {
      date: Date,
      tasksCompleted: Number,
    },
    bestWeek: {
      startDate: Date,
      tasksCompleted: Number,
    },

    // Historique
    completionHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        tasksCompleted: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Limiter l'historique à 90 jours
userStatsSchema.pre('save', function (next) {
  if (this.completionHistory && this.completionHistory.length > 90) {
    this.completionHistory = this.completionHistory.slice(-90);
  }
  next();
});

export default mongoose.model<IUserStats>('UserStats', userStatsSchema);
