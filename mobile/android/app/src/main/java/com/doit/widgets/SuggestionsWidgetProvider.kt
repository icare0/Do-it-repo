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
 * Smart Suggestions Widget - Shows AI-powered optimization suggestions
 * Size: Medium (4x2)
 */
class SuggestionsWidgetProvider : AppWidgetProvider() {

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
            val views = RemoteViews(context.packageName, R.layout.widget_suggestions)

            // Load suggestions data
            val data = WidgetDataProvider.getSuggestionsData(context)

            if (data != null && data.suggestions.isNotEmpty()) {
                // Show suggestions content
                views.setViewVisibility(R.id.suggestions_content, android.view.View.VISIBLE)
                views.setViewVisibility(R.id.empty_state, android.view.View.GONE)

                // Set suggestions count
                views.setTextViewText(R.id.suggestions_count, "${data.totalSuggestions}")

                // Set high priority count if available
                if (data.highPriorityCount > 0) {
                    views.setTextViewText(R.id.high_priority_badge, "${data.highPriorityCount}")
                    views.setViewVisibility(R.id.high_priority_container, android.view.View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.high_priority_container, android.view.View.GONE)
                }

                // Display top 3 suggestions
                val topSuggestions = data.suggestions.take(3)

                // Suggestion 1
                if (topSuggestions.isNotEmpty()) {
                    populateSuggestion(
                        context,
                        views,
                        topSuggestions[0],
                        R.id.suggestion_1_container,
                        R.id.suggestion_1_icon,
                        R.id.suggestion_1_title,
                        R.id.suggestion_1_confidence,
                        R.id.suggestion_1_impact
                    )
                } else {
                    views.setViewVisibility(R.id.suggestion_1_container, android.view.View.GONE)
                }

                // Suggestion 2
                if (topSuggestions.size > 1) {
                    populateSuggestion(
                        context,
                        views,
                        topSuggestions[1],
                        R.id.suggestion_2_container,
                        R.id.suggestion_2_icon,
                        R.id.suggestion_2_title,
                        R.id.suggestion_2_confidence,
                        R.id.suggestion_2_impact
                    )
                } else {
                    views.setViewVisibility(R.id.suggestion_2_container, android.view.View.GONE)
                }

                // Suggestion 3
                if (topSuggestions.size > 2) {
                    populateSuggestion(
                        context,
                        views,
                        topSuggestions[2],
                        R.id.suggestion_3_container,
                        R.id.suggestion_3_icon,
                        R.id.suggestion_3_title,
                        R.id.suggestion_3_confidence,
                        R.id.suggestion_3_impact
                    )
                } else {
                    views.setViewVisibility(R.id.suggestion_3_container, android.view.View.GONE)
                }

            } else {
                // No suggestions - show empty state
                views.setViewVisibility(R.id.suggestions_content, android.view.View.GONE)
                views.setViewVisibility(R.id.empty_state, android.view.View.VISIBLE)
            }

            // Set click intent for deep linking
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("doit://suggestions")
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

        private fun populateSuggestion(
            context: Context,
            views: RemoteViews,
            suggestion: WidgetSuggestionData,
            containerId: Int,
            iconId: Int,
            titleId: Int,
            confidenceId: Int,
            impactId: Int
        ) {
            views.setViewVisibility(containerId, android.view.View.VISIBLE)

            // Set icon based on type
            val icon = when (suggestion.type) {
                WidgetSuggestionData.SuggestionType.RESCHEDULE -> "📅"
                WidgetSuggestionData.SuggestionType.REORDER -> "🔄"
                WidgetSuggestionData.SuggestionType.GROUP -> "📦"
                WidgetSuggestionData.SuggestionType.SKIP -> "⏭️"
                WidgetSuggestionData.SuggestionType.SPLIT -> "✂️"
                WidgetSuggestionData.SuggestionType.COMBINE -> "🔗"
            }
            views.setTextViewText(iconId, icon)

            // Set priority color
            val priorityColor = when (suggestion.priority) {
                WidgetSuggestionData.Priority.CRITICAL -> 0xFFEF4444.toInt()
                WidgetSuggestionData.Priority.HIGH -> 0xFFF59E0B.toInt()
                WidgetSuggestionData.Priority.MEDIUM -> 0xFF3B82F6.toInt()
                WidgetSuggestionData.Priority.LOW -> 0xFF10B981.toInt()
            }
            views.setInt(iconId, "setTextColor", priorityColor)

            // Set title
            views.setTextViewText(titleId, suggestion.title)

            // Set confidence
            views.setTextViewText(confidenceId, "${suggestion.confidence}%")

            // Set impact if available
            suggestion.impact?.let { impact ->
                val impactText = buildString {
                    impact.timeSaved?.let { time ->
                        if (time > 0) {
                            append("⏱️ ${time}min")
                        }
                    }
                    impact.distanceSaved?.let { distance ->
                        if (distance > 0) {
                            if (isNotEmpty()) append(" • ")
                            append("📍 ${String.format("%.1f", distance)}km")
                        }
                    }
                }
                if (impactText.isNotEmpty()) {
                    views.setTextViewText(impactId, impactText)
                    views.setViewVisibility(impactId, android.view.View.VISIBLE)
                } else {
                    views.setViewVisibility(impactId, android.view.View.GONE)
                }
            } ?: run {
                views.setViewVisibility(impactId, android.view.View.GONE)
            }
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetClass = SuggestionsWidgetProvider::class.java
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, widgetClass)
            )

            for (appWidgetId in appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
