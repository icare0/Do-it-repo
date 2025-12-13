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
 * Stats Widget - Displays productivity statistics
 * Medium size only (4x2)
 */
class StatsWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Single

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme {
                val data = WidgetDataProvider.getStatsData(context)
                StatsWidgetContent(data, context)
            }
        }
    }
}

@Composable
fun StatsWidgetContent(data: WidgetStatsData?, context: Context) {
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
            .cornerRadius(16.dp)
            .padding(16.dp)
            .clickable(actionStartActivity(createDeepLinkIntent(context, "doit://stats")))
    ) {
        if (data != null) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Image(
                        provider = ImageProvider(R.drawable.ic_chart),
                        contentDescription = "Chart",
                        modifier = GlanceModifier.size(16.dp)
                    )
                    Spacer(modifier = GlanceModifier.width(6.dp))
                    Text(
                        text = "Statistiques",
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.onBackground
                        )
                    )

                    Spacer(modifier = GlanceModifier.defaultWeight())

                    // Period badge
                    Box(
                        modifier = GlanceModifier
                            .background(ColorProvider(Color(0x269C27B0)))
                            .cornerRadius(8.dp)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = data.period.uppercase(),
                            style = TextStyle(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = ColorProvider(Color(0xFF9C27B0))
                            )
                        )
                    }
                }

                Spacer(modifier = GlanceModifier.height(12.dp))

                // Main stats grid
                Row(modifier = GlanceModifier.fillMaxWidth()) {
                    // Completion rate
                    Box(
                        modifier = GlanceModifier
                            .defaultWeight()
                            .background(ColorProvider(Color(0x1A3B82F6)))
                            .cornerRadius(12.dp)
                            .padding(12.dp)
                    ) {
                        Column {
                            Text(
                                text = "${data.completionRate}%",
                                style = TextStyle(
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ColorProvider(Color(0xFF3B82F6))
                                )
                            )
                            Spacer(modifier = GlanceModifier.height(4.dp))
                            Text(
                                text = "Taux de\ncomplétion",
                                style = TextStyle(
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = GlanceTheme.colors.secondary
                                ),
                                maxLines = 2
                            )
                        }
                    }

                    Spacer(modifier = GlanceModifier.width(12.dp))

                    // Total completed
                    Box(
                        modifier = GlanceModifier
                            .defaultWeight()
                            .background(ColorProvider(Color(0x1A10B981)))
                            .cornerRadius(12.dp)
                            .padding(12.dp)
                    ) {
                        Column {
                            Text(
                                text = "${data.totalCompleted}",
                                style = TextStyle(
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ColorProvider(Color(0xFF10B981))
                                )
                            )
                            Spacer(modifier = GlanceModifier.height(4.dp))
                            Text(
                                text = "Tâches\ncomplétées",
                                style = TextStyle(
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = GlanceTheme.colors.secondary
                                ),
                                maxLines = 2
                            )
                        }
                    }
                }

                Spacer(modifier = GlanceModifier.height(12.dp))

                // Streak and best streak
                Row(modifier = GlanceModifier.fillMaxWidth()) {
                    // Current streak
                    Box(
                        modifier = GlanceModifier
                            .defaultWeight()
                            .background(ColorProvider(Color(0x1AF59E0B)))
                            .cornerRadius(10.dp)
                            .padding(horizontal = 10.dp, vertical = 8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                            Image(
                                provider = ImageProvider(R.drawable.ic_flame),
                                contentDescription = "Streak",
                                modifier = GlanceModifier.size(14.dp)
                            )
                            Spacer(modifier = GlanceModifier.width(6.dp))
                            Column {
                                Text(
                                    text = "${data.currentStreak}",
                                    style = TextStyle(
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = GlanceTheme.colors.onBackground
                                    )
                                )
                                Text(
                                    text = "jours",
                                    style = TextStyle(
                                        fontSize = 9.sp,
                                        color = GlanceTheme.colors.secondary
                                    )
                                )
                            }
                        }
                    }

                    Spacer(modifier = GlanceModifier.width(12.dp))

                    // Best streak
                    Box(
                        modifier = GlanceModifier
                            .defaultWeight()
                            .background(ColorProvider(Color(0x1AEAB308)))
                            .cornerRadius(10.dp)
                            .padding(horizontal = 10.dp, vertical = 8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                            Image(
                                provider = ImageProvider(R.drawable.ic_trophy),
                                contentDescription = "Trophy",
                                modifier = GlanceModifier.size(14.dp)
                            )
                            Spacer(modifier = GlanceModifier.width(6.dp))
                            Column {
                                Text(
                                    text = "${data.bestStreak}",
                                    style = TextStyle(
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = GlanceTheme.colors.onBackground
                                    )
                                )
                                Text(
                                    text = "record",
                                    style = TextStyle(
                                        fontSize = 9.sp,
                                        color = GlanceTheme.colors.secondary
                                    )
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = GlanceModifier.height(12.dp))

                // Trend
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Image(
                        provider = ImageProvider(getTrendIcon(data.trend)),
                        contentDescription = "Trend",
                        modifier = GlanceModifier.size(12.dp)
                    )
                    Spacer(modifier = GlanceModifier.width(6.dp))
                    Text(
                        text = getTrendText(data.trend),
                        style = TextStyle(
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = GlanceTheme.colors.secondary
                        )
                    )

                    Spacer(modifier = GlanceModifier.defaultWeight())

                    Text(
                        text = "${String.format("%.1f", data.averagePerDay)} tâches/jour",
                        style = TextStyle(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = GlanceTheme.colors.secondary
                        )
                    )
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
                    provider = ImageProvider(R.drawable.ic_chart),
                    contentDescription = "Chart",
                    modifier = GlanceModifier.size(40.dp)
                )
                Spacer(modifier = GlanceModifier.height(12.dp))
                Text(
                    text = "Pas encore de données",
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = GlanceTheme.colors.onBackground
                    )
                )
                Spacer(modifier = GlanceModifier.height(4.dp))
                Text(
                    text = "Complétez des tâches pour voir vos statistiques",
                    style = TextStyle(
                        fontSize = 11.sp,
                        color = GlanceTheme.colors.secondary
                    )
                )
            }
        }
    }
}

fun getTrendIcon(trend: WidgetStatsData.Trend): Int {
    return when (trend) {
        WidgetStatsData.Trend.UP -> R.drawable.ic_arrow_up
        WidgetStatsData.Trend.DOWN -> R.drawable.ic_arrow_down
        WidgetStatsData.Trend.STABLE -> R.drawable.ic_arrow_right
    }
}

fun getTrendText(trend: WidgetStatsData.Trend): String {
    return when (trend) {
        WidgetStatsData.Trend.UP -> "En progression"
        WidgetStatsData.Trend.DOWN -> "En baisse"
        WidgetStatsData.Trend.STABLE -> "Stable"
    }
}

class StatsWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = StatsWidget()
}
