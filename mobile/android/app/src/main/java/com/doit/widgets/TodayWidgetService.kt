package com.doit.widgets

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.icare.doit.R

/**
 * Service for Today Widget ListView
 */
class TodayWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return TodayWidgetFactory(applicationContext)
    }
}

class TodayWidgetFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {
    private var tasks: List<WidgetTaskData> = emptyList()

    override fun onCreate() {
        // Initialize
    }

    override fun onDataSetChanged() {
        // Load data
        val data = WidgetDataProvider.getTodayData(context)
        tasks = data?.tasks?.take(4) ?: emptyList()
    }

    override fun onDestroy() {
        tasks = emptyList()
    }

    override fun getCount(): Int = tasks.size

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_task_item)
        val task = tasks[position]

        // Set checkbox icon
        val checkboxIcon = if (task.completed) {
            R.drawable.ic_check_circle
        } else {
            R.drawable.ic_circle
        }
        views.setImageViewResource(R.id.task_checkbox, checkboxIcon)

        // Set title
        views.setTextViewText(R.id.task_title, task.title)

        // Set time
        task.getFormattedTime()?.let { time ->
            views.setTextViewText(R.id.task_time, time)
            views.setViewVisibility(R.id.task_time, android.view.View.VISIBLE)
        } ?: run {
            views.setViewVisibility(R.id.task_time, android.view.View.GONE)
        }

        // Set priority color
        views.setInt(R.id.priority_indicator, "setBackgroundColor", task.getPriorityColor())

        return views
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = true
}
