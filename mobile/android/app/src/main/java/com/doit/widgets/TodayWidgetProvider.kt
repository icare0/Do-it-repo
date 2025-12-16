package com.doit.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.icare.doit.MainActivity
import com.icare.doit.R

/**
 * Today Widget - Shows today's tasks with progress
 * Compatible with Expo via RemoteViews
 */
class TodayWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Get widget size
        val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

        // Choose layout based on size
        val views = when {
            minWidth >= 250 && minHeight >= 250 -> createLargeWidget(context)
            minWidth >= 250 -> createMediumWidget(context)
            else -> createSmallWidget(context)
        }

        // Set click intent
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("doit://today")
            setClass(context, MainActivity::class.java)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun createSmallWidget(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_today_small)
        val data = WidgetDataProvider.getTodayData(context)

        if (data != null && data.nextTask != null) {
            // Show next task
            views.setTextViewText(R.id.next_task_title, data.nextTask.title)

            data.nextTask.getFormattedTime()?.let { time ->
                views.setTextViewText(R.id.next_task_time, time)
                views.setViewVisibility(R.id.next_task_time, android.view.View.VISIBLE)
            } ?: run {
                views.setViewVisibility(R.id.next_task_time, android.view.View.GONE)
            }

            val remaining = data.totalCount - data.completedCount
            val taskText = if (remaining > 1) "$remaining tâches" else "$remaining tâche"
            views.setTextViewText(R.id.task_count, taskText)
        } else {
            // Empty state
            views.setTextViewText(R.id.next_task_title, "Aucune tâche")
            views.setTextViewText(R.id.task_count, "0 tâche")
            views.setViewVisibility(R.id.next_task_time, android.view.View.GONE)
        }

        return views
    }

    private fun createMediumWidget(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_today_medium)
        val data = WidgetDataProvider.getTodayData(context)

        if (data != null) {
            // Set header
            views.setTextViewText(R.id.progress_text, "${data.completedCount}/${data.totalCount}")
            views.setTextViewText(R.id.completion_text, "${data.completedCount}/${data.totalCount} complétées")

            // Set list adapter
            val intent = Intent(context, TodayWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, -1)
                setData(Uri.parse(toUri(Intent.URI_INTENT_SCHEME)))
            }
            views.setRemoteAdapter(R.id.tasks_list, intent)
            views.setEmptyView(R.id.tasks_list, R.id.empty_view)
        } else {
            views.setTextViewText(R.id.progress_text, "0/0")
            views.setTextViewText(R.id.completion_text, "0/0 complétées")
        }

        return views
    }

    private fun createLargeWidget(context: Context): RemoteViews {
        // For now, use medium layout for large size
        // Can be customized later to show more tasks
        return createMediumWidget(context)
    }

    override fun onEnabled(context: Context) {
        // First widget added
    }

    override fun onDisabled(context: Context) {
        // Last widget removed
    }
}
