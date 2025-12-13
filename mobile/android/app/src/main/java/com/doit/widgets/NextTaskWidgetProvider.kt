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
 * Next Task Widget - Shows the next upcoming task
 * Size: Small (2x2)
 */
class NextTaskWidgetProvider : AppWidgetProvider() {

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
            val views = RemoteViews(context.packageName, R.layout.widget_next_task)

            // Load next task data
            val data = WidgetDataProvider.getNextTaskData(context)

            if (data != null) {
                // Task found - show task details
                views.setViewVisibility(R.id.task_content, android.view.View.VISIBLE)
                views.setViewVisibility(R.id.empty_state, android.view.View.GONE)

                // Set task title
                views.setTextViewText(R.id.task_title, data.title)

                // Set time if available
                data.getFormattedTime()?.let { time ->
                    views.setTextViewText(R.id.task_time, time)
                    views.setViewVisibility(R.id.task_time, android.view.View.VISIBLE)
                } ?: run {
                    views.setViewVisibility(R.id.task_time, android.view.View.GONE)
                }

                // Set category if available
                data.category?.let { category ->
                    views.setTextViewText(R.id.task_category, category)
                    views.setViewVisibility(R.id.task_category, android.view.View.VISIBLE)
                } ?: run {
                    views.setViewVisibility(R.id.task_category, android.view.View.GONE)
                }

                // Set priority color
                views.setInt(
                    R.id.priority_indicator,
                    "setBackgroundColor",
                    data.getPriorityColor()
                )

                // Set priority text
                val priorityText = when (data.priority) {
                    WidgetTaskData.Priority.HIGH -> "Urgent"
                    WidgetTaskData.Priority.MEDIUM -> "Normal"
                    WidgetTaskData.Priority.LOW -> "Faible"
                }
                views.setTextViewText(R.id.priority_text, priorityText)

                // Set location if available
                data.location?.let { location ->
                    views.setTextViewText(R.id.task_location, "📍 ${location.name}")
                    views.setViewVisibility(R.id.task_location, android.view.View.VISIBLE)
                } ?: run {
                    views.setViewVisibility(R.id.task_location, android.view.View.GONE)
                }

                // Set duration if available
                data.duration?.let { duration ->
                    val hours = duration / 60
                    val minutes = duration % 60
                    val durationText = when {
                        hours > 0 && minutes > 0 -> "${hours}h ${minutes}min"
                        hours > 0 -> "${hours}h"
                        else -> "${minutes}min"
                    }
                    views.setTextViewText(R.id.task_duration, "⏱️ $durationText")
                    views.setViewVisibility(R.id.task_duration, android.view.View.VISIBLE)
                } ?: run {
                    views.setViewVisibility(R.id.task_duration, android.view.View.GONE)
                }

            } else {
                // No task found - show empty state
                views.setViewVisibility(R.id.task_content, android.view.View.GONE)
                views.setViewVisibility(R.id.empty_state, android.view.View.VISIBLE)
            }

            // Set click intent for deep linking
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("doit://task")
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
            val widgetClass = NextTaskWidgetProvider::class.java
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, widgetClass)
            )

            for (appWidgetId in appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
