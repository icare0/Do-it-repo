package com.doit.widgets

import android.content.Context
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
import com.doit.R

/**
 * Next Task Widget - Displays the next urgent task
 * Small size only (2x2)
 */
class NextTaskWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Single

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme {
                val task = WidgetDataProvider.getNextTaskData(context)
                NextTaskWidgetContent(task, context)
            }
        }
    }
}

@Composable
fun NextTaskWidgetContent(task: WidgetTaskData?, context: Context) {
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
            .cornerRadius(16.dp)
            .padding(16.dp)
            .clickable(
                actionStartActivity(
                    createDeepLinkIntent(
                        context,
                        task?.let { "doit://task/${it.id}" } ?: "doit://today"
                    )
                )
            )
    ) {
        if (task != null) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.Top
            ) {
                // Priority badge
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Row(
                        modifier = GlanceModifier
                            .background(getPriorityColor(task.priority).getColor(context).copy(alpha = 0.15f))
                            .cornerRadius(8.dp)
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.Vertical.CenterVertically
                    ) {
                        Box(
                            modifier = GlanceModifier
                                .size(8.dp)
                                .cornerRadius(4.dp)
                                .background(getPriorityColor(task.priority))
                        )
                        Spacer(modifier = GlanceModifier.width(4.dp))
                        Text(
                            text = getPriorityLabel(task.priority),
                            style = TextStyle(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = getPriorityColor(task.priority).getColor(context)
                            )
                        )
                    }

                    Spacer(modifier = GlanceModifier.defaultWeight())

                    // Category icon
                    task.category?.let { category ->
                        Image(
                            provider = ImageProvider(getCategoryIcon(category)),
                            contentDescription = category,
                            modifier = GlanceModifier.size(12.dp)
                        )
                    }
                }

                Spacer(modifier = GlanceModifier.defaultWeight())

                // Task title
                Text(
                    text = task.title,
                    style = TextStyle(
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = GlanceTheme.colors.onBackground
                    ),
                    maxLines = 3
                )

                Spacer(modifier = GlanceModifier.defaultWeight())

                // Time, location, duration
                Column {
                    task.formattedTime?.let { time ->
                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                            Image(
                                provider = ImageProvider(R.drawable.ic_clock),
                                contentDescription = "Time",
                                modifier = GlanceModifier.size(11.dp)
                            )
                            Spacer(modifier = GlanceModifier.width(4.dp))
                            Text(
                                text = time,
                                style = TextStyle(
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = getPriorityColor(task.priority).getColor(context)
                                )
                            )
                        }
                        Spacer(modifier = GlanceModifier.height(4.dp))
                    }

                    task.location?.let { location ->
                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                            Image(
                                provider = ImageProvider(R.drawable.ic_location),
                                contentDescription = "Location",
                                modifier = GlanceModifier.size(10.dp)
                            )
                            Spacer(modifier = GlanceModifier.width(4.dp))
                            Text(
                                text = location.name,
                                style = TextStyle(
                                    fontSize = 11.sp,
                                    color = GlanceTheme.colors.secondary
                                ),
                                maxLines = 1
                            )
                        }
                        Spacer(modifier = GlanceModifier.height(4.dp))
                    }

                    task.duration?.let { duration ->
                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                            Image(
                                provider = ImageProvider(R.drawable.ic_timer),
                                contentDescription = "Duration",
                                modifier = GlanceModifier.size(10.dp)
                            )
                            Spacer(modifier = GlanceModifier.width(4.dp))
                            Text(
                                text = "$duration min",
                                style = TextStyle(
                                    fontSize = 11.sp,
                                    color = GlanceTheme.colors.secondary
                                )
                            )
                        }
                    }
                }
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
                    modifier = GlanceModifier.size(36.dp)
                )
                Spacer(modifier = GlanceModifier.height(8.dp))
                Text(
                    text = "Aucune tâche",
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = GlanceTheme.colors.onBackground
                    )
                )
                Spacer(modifier = GlanceModifier.height(4.dp))
                Text(
                    text = "Vous êtes à jour !",
                    style = TextStyle(
                        fontSize = 11.sp,
                        color = GlanceTheme.colors.secondary
                    )
                )
            }
        }
    }
}

fun getPriorityLabel(priority: WidgetTaskData.Priority): String {
    return when (priority) {
        WidgetTaskData.Priority.HIGH -> "URGENT"
        WidgetTaskData.Priority.MEDIUM -> "MOYEN"
        WidgetTaskData.Priority.LOW -> "FAIBLE"
    }
}

fun getCategoryIcon(category: String): Int {
    return when (category.lowercase()) {
        "work", "travail" -> R.drawable.ic_briefcase
        "shopping", "courses" -> R.drawable.ic_cart
        "health", "santé", "sport" -> R.drawable.ic_heart
        "personal", "personnel" -> R.drawable.ic_person
        "home", "maison" -> R.drawable.ic_home
        else -> R.drawable.ic_folder
    }
}

class NextTaskWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = NextTaskWidget()
}
