package com.doit.widgets

import android.content.Context
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName

/**
 * Data provider for widgets
 * Reads data from SharedPreferences written by React Native
 */
object WidgetDataProvider {
    private const val SHARED_PREFS_NAME = "DoItWidgetData"
    private const val KEY_TODAY = "widget_today"
    private const val KEY_NEXT_TASK = "widget_next_task"
    private const val KEY_STATS = "widget_stats"
    private const val KEY_SUGGESTIONS = "widget_suggestions"

    private val gson = Gson()

    fun getTodayData(context: Context): WidgetTodayData? {
        return getData(context, KEY_TODAY, WidgetTodayData::class.java)
    }

    fun getNextTaskData(context: Context): WidgetTaskData? {
        return getData(context, KEY_NEXT_TASK, WidgetTaskData::class.java)
    }

    fun getStatsData(context: Context): WidgetStatsData? {
        return getData(context, KEY_STATS, WidgetStatsData::class.java)
    }

    fun getSuggestionsData(context: Context): WidgetSuggestionsData? {
        return getData(context, KEY_SUGGESTIONS, WidgetSuggestionsData::class.java)
    }

    private fun <T> getData(context: Context, key: String, classOfT: Class<T>): T? {
        return try {
            val prefs = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
            val jsonString = prefs.getString(key, null) ?: return null
            gson.fromJson(jsonString, classOfT)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

// MARK: - Data Models

data class WidgetTodayData(
    val tasks: List<WidgetTaskData>,
    val completedCount: Int,
    val totalCount: Int,
    val progressPercentage: Int,
    val nextTask: WidgetTaskData?,
    val lastUpdated: String
)

data class WidgetTaskData(
    val id: String,
    val title: String,
    val completed: Boolean,
    val priority: Priority,
    val category: String?,
    val startDate: String?,
    val duration: Int?,
    val location: Location?
) {
    enum class Priority {
        @SerializedName("high") HIGH,
        @SerializedName("medium") MEDIUM,
        @SerializedName("low") LOW
    }

    data class Location(
        val name: String,
        val latitude: Double? = null,
        val longitude: Double? = null
    )

    fun getFormattedTime(): String? {
        if (startDate == null) return null
        return try {
            val instant = java.time.Instant.parse(startDate)
            val zonedDateTime = instant.atZone(java.time.ZoneId.systemDefault())
            val formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm")
            zonedDateTime.format(formatter)
        } catch (e: Exception) {
            null
        }
    }

    fun getPriorityColor(): Int {
        return when (priority) {
            Priority.HIGH -> 0xFFEF4444.toInt()
            Priority.MEDIUM -> 0xFFF59E0B.toInt()
            Priority.LOW -> 0xFF10B981.toInt()
        }
    }
}

data class WidgetStatsData(
    val completionRate: Int,
    val totalCompleted: Int,
    val totalTasks: Int,
    val currentStreak: Int,
    val bestStreak: Int,
    val averagePerDay: Double,
    val trend: Trend,
    val period: String,
    val lastUpdated: String
) {
    enum class Trend {
        @SerializedName("up") UP,
        @SerializedName("down") DOWN,
        @SerializedName("stable") STABLE
    }
}

data class WidgetSuggestionsData(
    val suggestions: List<WidgetSuggestionData>,
    val totalSuggestions: Int,
    val highPriorityCount: Int,
    val lastUpdated: String
)

data class WidgetSuggestionData(
    val id: String,
    val type: SuggestionType,
    val title: String,
    val confidence: Int,
    val priority: Priority,
    val impact: Impact?
) {
    enum class SuggestionType {
        @SerializedName("reschedule") RESCHEDULE,
        @SerializedName("reorder") REORDER,
        @SerializedName("group") GROUP,
        @SerializedName("skip") SKIP,
        @SerializedName("split") SPLIT,
        @SerializedName("combine") COMBINE
    }

    enum class Priority {
        @SerializedName("critical") CRITICAL,
        @SerializedName("high") HIGH,
        @SerializedName("medium") MEDIUM,
        @SerializedName("low") LOW
    }

    data class Impact(
        val timeSaved: Int?,
        val distanceSaved: Double?
    )
}
