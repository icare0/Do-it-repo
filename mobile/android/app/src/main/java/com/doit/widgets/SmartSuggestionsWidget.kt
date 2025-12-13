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
 * Smart Suggestions Widget - Displays optimization suggestions
 * Medium size only (4x2)
 */
class SmartSuggestionsWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Single

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme {
                val data = WidgetDataProvider.getSuggestionsData(context)
                SmartSuggestionsWidgetContent(data, context)
            }
        }
    }
}

@Composable
fun SmartSuggestionsWidgetContent(data: WidgetSuggestionsData?, context: Context) {
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
            .cornerRadius(16.dp)
            .padding(16.dp)
            .clickable(actionStartActivity(createDeepLinkIntent(context, "doit://smart-assistant")))
    ) {
        if (data != null && data.suggestions.isNotEmpty()) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Image(
                        provider = ImageProvider(R.drawable.ic_brain),
                        contentDescription = "Brain",
                        modifier = GlanceModifier.size(16.dp)
                    )
                    Spacer(modifier = GlanceModifier.width(6.dp))
                    Text(
                        text = "Assistant Intelligent",
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.onBackground
                        )
                    )

                    Spacer(modifier = GlanceModifier.defaultWeight())

                    // Count badge
                    Box(
                        modifier = GlanceModifier
                            .size(24.dp)
                            .background(ColorProvider(Color(0xFF6366F1)))
                            .cornerRadius(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${data.suggestions.size}",
                            style = TextStyle(
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = ColorProvider(Color.White)
                            )
                        )
                    }
                }

                Spacer(modifier = GlanceModifier.height(12.dp))

                // Top suggestion (primary)
                data.suggestions.firstOrNull()?.let { topSuggestion ->
                    Box(
                        modifier = GlanceModifier
                            .fillMaxWidth()
                            .background(ColorProvider(Color(0x146366F1)))
                            .cornerRadius(12.dp)
                            .padding(12.dp)
                    ) {
                        Column {
                            // Type and confidence
                            Row(
                                modifier = GlanceModifier.fillMaxWidth(),
                                verticalAlignment = Alignment.Vertical.CenterVertically
                            ) {
                                Box(
                                    modifier = GlanceModifier
                                        .background(getSuggestionPriorityColor(topSuggestion.priority).getColor(context).copy(alpha = 0.15f))
                                        .cornerRadius(8.dp)
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                                        Image(
                                            provider = ImageProvider(getSuggestionIcon(topSuggestion.type)),
                                            contentDescription = "Suggestion type",
                                            modifier = GlanceModifier.size(11.dp)
                                        )
                                        Spacer(modifier = GlanceModifier.width(4.dp))
                                        Text(
                                            text = getSuggestionTypeLabel(topSuggestion.type),
                                            style = TextStyle(
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = getSuggestionPriorityColor(topSuggestion.priority).getColor(context)
                                            )
                                        )
                                    }
                                }

                                Spacer(modifier = GlanceModifier.defaultWeight())

                                // Confidence dots
                                Row {
                                    repeat(3) { index ->
                                        Box(
                                            modifier = GlanceModifier
                                                .size(5.dp)
                                                .cornerRadius(2.5.dp)
                                                .background(
                                                    if (index < getConfidenceLevel(topSuggestion.confidence)) {
                                                        ColorProvider(Color(0xFF6366F1))
                                                    } else {
                                                        ColorProvider(Color(0x4D6B7280))
                                                    }
                                                )
                                        )
                                        if (index < 2) Spacer(modifier = GlanceModifier.width(2.dp))
                                    }
                                }
                            }

                            Spacer(modifier = GlanceModifier.height(8.dp))

                            // Title
                            Text(
                                text = topSuggestion.title,
                                style = TextStyle(
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GlanceTheme.colors.onBackground
                                ),
                                maxLines = 2
                            )

                            // Impact metrics
                            topSuggestion.impact?.let { impact ->
                                Spacer(modifier = GlanceModifier.height(8.dp))
                                Row {
                                    impact.timeSaved?.let { timeSaved ->
                                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                                            Image(
                                                provider = ImageProvider(R.drawable.ic_clock_arrow),
                                                contentDescription = "Time saved",
                                                modifier = GlanceModifier.size(10.dp)
                                            )
                                            Spacer(modifier = GlanceModifier.width(4.dp))
                                            Text(
                                                text = "+$timeSaved min",
                                                style = TextStyle(
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    color = ColorProvider(Color(0xFF10B981))
                                                )
                                            )
                                        }
                                    }

                                    if (impact.timeSaved != null && impact.distanceSaved != null) {
                                        Spacer(modifier = GlanceModifier.width(12.dp))
                                    }

                                    impact.distanceSaved?.let { distanceSaved ->
                                        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                                            Image(
                                                provider = ImageProvider(R.drawable.ic_arrow_swap),
                                                contentDescription = "Distance saved",
                                                modifier = GlanceModifier.size(10.dp)
                                            )
                                            Spacer(modifier = GlanceModifier.width(4.dp))
                                            Text(
                                                text = "-${String.format("%.1f", distanceSaved)} km",
                                                style = TextStyle(
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    color = ColorProvider(Color(0xFF3B82F6))
                                                )
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = GlanceModifier.height(6.dp))

                // Additional suggestions (compact)
                if (data.suggestions.size > 1) {
                    Column {
                        data.suggestions.drop(1).take(2).forEach { suggestion ->
                            Box(
                                modifier = GlanceModifier
                                    .fillMaxWidth()
                                    .background(ColorProvider(Color(0x14000000)))
                                    .cornerRadius(8.dp)
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Row(
                                    modifier = GlanceModifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.Vertical.CenterVertically
                                ) {
                                    Image(
                                        provider = ImageProvider(getSuggestionIcon(suggestion.type)),
                                        contentDescription = "Type",
                                        modifier = GlanceModifier.size(11.dp)
                                    )
                                    Spacer(modifier = GlanceModifier.width(8.dp))
                                    Text(
                                        text = suggestion.title,
                                        style = TextStyle(
                                            fontSize = 12.sp,
                                            color = GlanceTheme.colors.onBackground
                                        ),
                                        maxLines = 1,
                                        modifier = GlanceModifier.defaultWeight()
                                    )
                                    Image(
                                        provider = ImageProvider(R.drawable.ic_chevron_right),
                                        contentDescription = "More",
                                        modifier = GlanceModifier.size(10.dp)
                                    )
                                }
                            }
                            Spacer(modifier = GlanceModifier.height(6.dp))
                        }
                    }
                }

                // Footer
                if (data.suggestions.size > 3) {
                    Text(
                        text = "+${data.suggestions.size - 3} autres suggestions",
                        style = TextStyle(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = GlanceTheme.colors.secondary
                        ),
                        modifier = GlanceModifier.padding(horizontal = 4.dp)
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
                    provider = ImageProvider(R.drawable.ic_check_seal),
                    contentDescription = "Optimal",
                    modifier = GlanceModifier.size(40.dp)
                )
                Spacer(modifier = GlanceModifier.height(12.dp))
                Text(
                    text = "Tout est optimal !",
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = GlanceTheme.colors.onBackground
                    )
                )
                Spacer(modifier = GlanceModifier.height(4.dp))
                Text(
                    text = "Aucune suggestion d'optimisation",
                    style = TextStyle(
                        fontSize = 11.sp,
                        color = GlanceTheme.colors.secondary
                    )
                )
            }
        }
    }
}

fun getSuggestionIcon(type: WidgetSuggestionData.SuggestionType): Int {
    return when (type) {
        WidgetSuggestionData.SuggestionType.RESCHEDULE -> R.drawable.ic_calendar_clock
        WidgetSuggestionData.SuggestionType.REORDER -> R.drawable.ic_arrow_up_down
        WidgetSuggestionData.SuggestionType.GROUP -> R.drawable.ic_stack
        WidgetSuggestionData.SuggestionType.SKIP -> R.drawable.ic_forward
        WidgetSuggestionData.SuggestionType.SPLIT -> R.drawable.ic_scissors
        WidgetSuggestionData.SuggestionType.COMBINE -> R.drawable.ic_link
    }
}

fun getSuggestionTypeLabel(type: WidgetSuggestionData.SuggestionType): String {
    return when (type) {
        WidgetSuggestionData.SuggestionType.RESCHEDULE -> "Reprogrammer"
        WidgetSuggestionData.SuggestionType.REORDER -> "Réorganiser"
        WidgetSuggestionData.SuggestionType.GROUP -> "Grouper"
        WidgetSuggestionData.SuggestionType.SKIP -> "Reporter"
        WidgetSuggestionData.SuggestionType.SPLIT -> "Diviser"
        WidgetSuggestionData.SuggestionType.COMBINE -> "Combiner"
    }
}

fun getSuggestionPriorityColor(priority: WidgetSuggestionData.Priority): ColorProvider {
    return when (priority) {
        WidgetSuggestionData.Priority.CRITICAL -> ColorProvider(Color(0xFFDC2626))
        WidgetSuggestionData.Priority.HIGH -> ColorProvider(Color(0xFFF59E0B))
        WidgetSuggestionData.Priority.MEDIUM -> ColorProvider(Color(0xFF3B82F6))
        WidgetSuggestionData.Priority.LOW -> ColorProvider(Color(0xFF6B7280))
    }
}

fun getConfidenceLevel(confidence: Int): Int {
    return when {
        confidence >= 80 -> 3
        confidence >= 60 -> 2
        else -> 1
    }
}

class SmartSuggestionsWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SmartSuggestionsWidget()
}
