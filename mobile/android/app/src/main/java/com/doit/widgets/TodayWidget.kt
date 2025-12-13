package com.doit.widgets

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.doit.MainActivity
import com.doit.R

/**
 * Today Widget - Displays today's tasks with progress
 * Supports Small, Medium, and Large sizes
 */
class TodayWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Responsive(
        setOf(
            // Small: 2x2
            androidx.glance.appwidget.LocalSize(width = 120.dp, height = 120.dp),
            // Medium: 4x2
            androidx.glance.appwidget.LocalSize(width = 260.dp, height = 120.dp),
            // Large: 4x4
            androidx.glance.appwidget.LocalSize(width = 260.dp, height = 280.dp)
        )
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme {
                val data = WidgetDataProvider.getTodayData(context)
                val size = androidx.glance.appwidget.LocalSize.current

                when {
                    size.width < 200.dp -> TodayWidgetSmall(data, context)
                    size.height < 200.dp -> TodayWidgetMedium(data, context)
                    else -> TodayWidgetLarge(data, context)
                }
            }
        }
    }
}

@Composable
fun TodayWidgetSmall(data: WidgetTodayData?, context: Context) {
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
            .cornerRadius(16.dp)
            .padding(16.dp)
            .clickable(actionStartActivity(createDeepLinkIntent(context, "doit://today")))
    ) {
        if (data != null && data.nextTask != null) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.Top
            ) {
                // Header
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Image(
                        provider = ImageProvider(R.drawable.ic_calendar),
                        contentDescription = "Calendar",
                        modifier = GlanceModifier.size(14.dp)
                    )
                    Spacer(modifier = GlanceModifier.width(4.dp))
                    Text(
                        text = "Aujourd'hui",
                        style = TextStyle(
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = GlanceTheme.colors.secondary
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.defaultWeight())

                // Next task
                Column {
                    Text(
                        text = data.nextTask.title,
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.onBackground
                        ),
                        maxLines = 2
                    )

                    data.nextTask.formattedTime?.let { time ->
                        Spacer(modifier = GlanceModifier.height(4.dp))
                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                            Image(
                                provider = ImageProvider(R.drawable.ic_clock),
                                contentDescription = "Time",
                                modifier = GlanceModifier.size(10.dp)
                            )
                            Spacer(modifier = GlanceModifier.width(4.dp))
                            Text(
                                text = time,
                                style = TextStyle(
                                    fontSize = 11.sp,
                                    color = GlanceTheme.colors.secondary
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = GlanceModifier.defaultWeight())

                // Count
                Text(
                    text = "${data.totalCount - data.completedCount} tâche${if (data.totalCount - data.completedCount > 1) "s" else ""}",
                    style = TextStyle(
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = GlanceTheme.colors.secondary
                    )
                )
            }
        } else {
            // Empty state
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                Image(
                    provider = ImageProvider(R.drawable.ic_check_circle),
                    contentDescription = "Done",
                    modifier = GlanceModifier.size(32.dp)
                )
                Spacer(modifier = GlanceModifier.height(8.dp))
                Text(
                    text = "Aucune tâche",
                    style = TextStyle(
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = GlanceTheme.colors.secondary
                    )
                )
            }
        }
    }
}

@Composable
fun TodayWidgetMedium(data: WidgetTodayData?, context: Context) {
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
            .cornerRadius(16.dp)
            .padding(16.dp)
            .clickable(actionStartActivity(createDeepLinkIntent(context, "doit://today")))
    ) {
        if (data != null) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                // Header with progress
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Image(
                        provider = ImageProvider(R.drawable.ic_calendar),
                        contentDescription = "Calendar",
                        modifier = GlanceModifier.size(14.dp)
                    )
                    Spacer(modifier = GlanceModifier.width(6.dp))
                    Text(
                        text = "Aujourd'hui",
                        style = TextStyle(
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.onBackground
                        )
                    )

                    Spacer(modifier = GlanceModifier.defaultWeight())

                    // Progress dots
                    Row(horizontalAlignment = Alignment.Horizontal.End) {
                        repeat(5) { index ->
                            Box(
                                modifier = GlanceModifier
                                    .size(6.dp)
                                    .cornerRadius(3.dp)
                                    .background(
                                        if (index < (data.progressValue * 5).toInt()) {
                                            ColorProvider(Color(0xFF3B82F6))
                                        } else {
                                            ColorProvider(Color(0x4D6B7280))
                                        }
                                    )
                            )
                            if (index < 4) Spacer(modifier = GlanceModifier.width(3.dp))
                        }
                    }
                }

                Spacer(modifier = GlanceModifier.height(12.dp))

                // Tasks list
                Column(modifier = GlanceModifier.fillMaxWidth()) {
                    data.tasks.take(4).forEach { task ->
                        TaskRow(task)
                        Spacer(modifier = GlanceModifier.height(8.dp))
                    }
                }

                Spacer(modifier = GlanceModifier.defaultWeight())

                // Footer
                Text(
                    text = "${data.completedCount}/${data.totalCount} complétées",
                    style = TextStyle(
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = GlanceTheme.colors.secondary
                    )
                )
            }
        } else {
            EmptyState()
        }
    }
}

@Composable
fun TodayWidgetLarge(data: WidgetTodayData?, context: Context) {
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
            .cornerRadius(16.dp)
            .padding(16.dp)
            .clickable(actionStartActivity(createDeepLinkIntent(context, "doit://today")))
    ) {
        if (data != null) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Image(
                        provider = ImageProvider(R.drawable.ic_calendar),
                        contentDescription = "Calendar",
                        modifier = GlanceModifier.size(16.dp)
                    )
                    Spacer(modifier = GlanceModifier.width(6.dp))
                    Text(
                        text = "Aujourd'hui",
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.onBackground
                        )
                    )

                    Spacer(modifier = GlanceModifier.defaultWeight())

                    Text(
                        text = "${data.completedCount}/${data.totalCount}",
                        style = TextStyle(
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.secondary
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(8.dp))

                // Progress bar
                Box(
                    modifier = GlanceModifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .cornerRadius(3.dp)
                        .background(ColorProvider(Color(0x33000000)))
                ) {
                    Box(
                        modifier = GlanceModifier
                            .fillMaxHeight()
                            .fillMaxWidth(data.progressValue)
                            .cornerRadius(3.dp)
                            .background(ColorProvider(Color(0xFF3B82F6)))
                    )
                }

                Spacer(modifier = GlanceModifier.height(12.dp))

                // Tasks list
                Column(modifier = GlanceModifier.fillMaxWidth()) {
                    data.tasks.take(8).forEach { task ->
                        TaskRow(task)
                        Spacer(modifier = GlanceModifier.height(8.dp))
                    }
                }

                Spacer(modifier = GlanceModifier.defaultWeight())

                // Motivational message
                if (data.progressPercentage >= 80) {
                    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                        Image(
                            provider = ImageProvider(R.drawable.ic_star),
                            contentDescription = "Star",
                            modifier = GlanceModifier.size(12.dp)
                        )
                        Spacer(modifier = GlanceModifier.width(4.dp))
                        Text(
                            text = "Excellent progrès !",
                            style = TextStyle(
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                color = GlanceTheme.colors.secondary
                            )
                        )
                    }
                }
            }
        } else {
            EmptyState()
        }
    }
}

@Composable
fun TaskRow(task: WidgetTaskData) {
    Row(
        modifier = GlanceModifier.fillMaxWidth(),
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        // Checkbox
        Image(
            provider = ImageProvider(
                if (task.completed) R.drawable.ic_check_circle_filled
                else R.drawable.ic_circle
            ),
            contentDescription = if (task.completed) "Completed" else "Not completed",
            modifier = GlanceModifier.size(16.dp)
        )

        Spacer(modifier = GlanceModifier.width(10.dp))

        // Task info
        Column(modifier = GlanceModifier.defaultWeight()) {
            Text(
                text = task.title,
                style = TextStyle(
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (task.completed) GlanceTheme.colors.secondary
                    else GlanceTheme.colors.onBackground
                ),
                maxLines = 1
            )

            task.formattedTime?.let { time ->
                Spacer(modifier = GlanceModifier.height(2.dp))
                Text(
                    text = time,
                    style = TextStyle(
                        fontSize = 10.sp,
                        color = GlanceTheme.colors.secondary
                    )
                )
            }
        }

        // Priority indicator
        Box(
            modifier = GlanceModifier
                .size(8.dp)
                .cornerRadius(4.dp)
                .background(getPriorityColor(task.priority))
        )
    }
}

@Composable
fun EmptyState() {
    Column(
        modifier = GlanceModifier.fillMaxSize(),
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        Image(
            provider = ImageProvider(R.drawable.ic_check_circle),
            contentDescription = "Done",
            modifier = GlanceModifier.size(40.dp)
        )
        Spacer(modifier = GlanceModifier.height(12.dp))
        Text(
            text = "Aucune tâche pour aujourd'hui",
            style = TextStyle(
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = GlanceTheme.colors.onBackground
            )
        )
        Spacer(modifier = GlanceModifier.height(4.dp))
        Text(
            text = "Profitez de votre journée !",
            style = TextStyle(
                fontSize = 12.sp,
                color = GlanceTheme.colors.secondary
            )
        )
    }
}

fun getPriorityColor(priority: WidgetTaskData.Priority): ColorProvider {
    return when (priority) {
        WidgetTaskData.Priority.HIGH -> ColorProvider(Color(0xFFEF4444))
        WidgetTaskData.Priority.MEDIUM -> ColorProvider(Color(0xFFF59E0B))
        WidgetTaskData.Priority.LOW -> ColorProvider(Color(0xFF10B981))
    }
}

fun createDeepLinkIntent(context: Context, deepLink: String): Intent {
    return Intent(Intent.ACTION_VIEW).apply {
        data = android.net.Uri.parse(deepLink)
        setClass(context, MainActivity::class.java)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
}

class TodayWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = TodayWidget()
}
