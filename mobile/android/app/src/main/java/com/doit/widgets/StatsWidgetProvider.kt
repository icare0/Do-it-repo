package com.doit.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.doit.MainActivity
import com.doit.R

/**
 * Stats Widget - Shows productivity statistics
 * Size: Medium (4x2)
 */
class StatsWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        // First widget instance created
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        // Last widget instance removed
    }

    companion object {
        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_stats)

            // Load stats data
            val data = WidgetDataProvider.getStatsData(context)

            if (data != null) {
                // Show stats content
                views.setViewVisibility(R.id.stats_content, android.view.View.VISIBLE)
                views.setViewVisibility(R.id.empty_state, android.view.View.GONE)

                // Completion Rate
                views.setTextViewText(R.id.completion_rate_value, "${data.completionRate}%")

                // Completion Rate Progress Bar (simulate with colored view)
                val progressWidth = (data.completionRate * 2.5).toInt() // Scale to fit widget width
                views.setInt(R.id.completion_rate_progress, "setMaxWidth", 250)

                // Tasks Completed
                views.setTextViewText(R.id.tasks_completed_value, "${data.totalCompleted}")
                views.setTextViewText(R.id.tasks_total_value, "/${data.totalTasks}")

                // Current Streak
                views.setTextViewText(R.id.current_streak_value, "${data.currentStreak}")
                val streakText = if (data.currentStreak > 1) "jours" else "jour"
                views.setTextViewText(R.id.current_streak_label, streakText)

                // Best Streak
                views.setTextViewText(R.id.best_streak_value, "${data.bestStreak}")

                // Average Per Day
                views.setTextViewText(R.id.average_value, String.format("%.1f", data.averagePerDay))

                // Trend Indicator
                val (trendIcon, trendColor) = when (data.trend) {
                    WidgetStatsData.Trend.UP -> Pair("📈", 0xFF10B981.toInt())
                    WidgetStatsData.Trend.DOWN -> Pair("📉", 0xFFEF4444.toInt())
                    WidgetStatsData.Trend.STABLE -> Pair("➡️", 0xFF6B7280.toInt())
                }
                views.setTextViewText(R.id.trend_icon, trendIcon)
                views.setTextColor(R.id.trend_icon, trendColor)

                // Period
                views.setTextViewText(R.id.period_text, data.period)

            } else {
                // No data - show empty state
                views.setViewVisibility(R.id.stats_content, android.view.View.GONE)
                views.setViewVisibility(R.id.empty_state, android.view.View.VISIBLE)
            }

            // Set click intent for deep linking
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("doit://stats")
                setClass(context, MainActivity::class.java)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            // Update widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetClass = StatsWidgetProvider::class.java
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, widgetClass)
            )

            for (appWidgetId in appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
