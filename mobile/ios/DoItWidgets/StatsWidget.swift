//
//  StatsWidget.swift
//  DoItWidgets
//
//  Widget displaying productivity statistics
//  Medium size only
//

import WidgetKit
import SwiftUI

// MARK: - Widget Entry

struct StatsEntry: TimelineEntry {
    let date: Date
    let data: WidgetStatsData?
}

// MARK: - Widget Provider

struct StatsProvider: TimelineProvider {
    func placeholder(in context: Context) -> StatsEntry {
        StatsEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (StatsEntry) -> Void) {
        let entry = StatsEntry(
            date: Date(),
            data: WidgetDataProvider.shared.getStatsData()
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StatsEntry>) -> Void) {
        let currentDate = Date()
        let data = WidgetDataProvider.shared.getStatsData()

        let entry = StatsEntry(date: currentDate, data: data)

        // Refresh every 30 minutes (stats don't change as frequently)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }
}

// MARK: - Widget View

struct StatsWidgetView: View {
    let entry: StatsEntry

    var body: some View {
        if let data = entry.data {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.purple)
                    Text("Statistiques")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.primary)

                    Spacer()

                    // Period indicator
                    Text(data.period.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.purple)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.purple.opacity(0.15))
                        .cornerRadius(8)
                }

                // Main stats grid
                HStack(spacing: 12) {
                    // Completion rate
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(data.completionRate)%")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.blue)

                        Text("Taux de\ncomplétion")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)

                    // Total completed
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(data.totalCompleted)")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.green)

                        Text("Tâches\ncomplétées")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                }

                // Streak and trend
                HStack(spacing: 12) {
                    // Streak
                    HStack(spacing: 6) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.orange)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(data.currentStreak)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.primary)
                            Text("jours")
                                .font(.system(size: 9))
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 10)
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(10)

                    // Best streak
                    HStack(spacing: 6) {
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.yellow)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(data.bestStreak)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.primary)
                            Text("record")
                                .font(.system(size: 9))
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 10)
                    .background(Color.yellow.opacity(0.1))
                    .cornerRadius(10)
                }

                // Trend indicator
                HStack(spacing: 6) {
                    Image(systemName: trendIcon(data.trend))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(trendColor(data.trend))

                    Text(trendText(data.trend))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)

                    Spacer()

                    // Average per day
                    Text("\(String(format: "%.1f", data.averagePerDay)) tâches/jour")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 4)
            }
            .padding(16)
        } else {
            emptyStateView()
        }
    }

    private func trendIcon(_ trend: WidgetStatsData.Trend) -> String {
        switch trend {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .stable: return "arrow.right"
        }
    }

    private func trendColor(_ trend: WidgetStatsData.Trend) -> Color {
        switch trend {
        case .up: return .green
        case .down: return .red
        case .stable: return .orange
        }
    }

    private func trendText(_ trend: WidgetStatsData.Trend) -> String {
        switch trend {
        case .up: return "En progression"
        case .down: return "En baisse"
        case .stable: return "Stable"
        }
    }

    private func emptyStateView() -> some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.bar.xaxis")
                .font(.system(size: 40))
                .foregroundColor(.secondary)

            VStack(spacing: 4) {
                Text("Pas encore de données")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                Text("Complétez des tâches pour voir vos statistiques")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Configuration

struct StatsWidget: Widget {
    let kind: String = "StatsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StatsProvider()) { entry in
            StatsWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Statistiques")
        .description("Affiche vos statistiques de productivité")
        .supportedFamilies([.systemMedium])
    }
}

struct StatsWidgetEntryView: View {
    var entry: StatsProvider.Entry

    var body: some View {
        ZStack {
            Color("WidgetBackground")
            StatsWidgetView(entry: entry)
                .widgetURL(DeepLink.stats.url)
        }
    }
}

// MARK: - Preview

struct StatsWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Good performance
            StatsWidgetEntryView(entry: StatsEntry(
                date: Date(),
                data: WidgetStatsData(
                    completionRate: 87,
                    totalCompleted: 142,
                    totalTasks: 163,
                    currentStreak: 12,
                    bestStreak: 18,
                    averagePerDay: 5.8,
                    trend: .up,
                    period: "7j",
                    lastUpdated: "2025-12-13T09:00:00Z"
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Good Performance")

            // Declining performance
            StatsWidgetEntryView(entry: StatsEntry(
                date: Date(),
                data: WidgetStatsData(
                    completionRate: 42,
                    totalCompleted: 38,
                    totalTasks: 90,
                    currentStreak: 2,
                    bestStreak: 15,
                    averagePerDay: 2.1,
                    trend: .down,
                    period: "7j",
                    lastUpdated: "2025-12-13T09:00:00Z"
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Declining")

            // Empty state
            StatsWidgetEntryView(entry: StatsEntry(date: Date(), data: nil))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Empty State")
        }
    }
}
