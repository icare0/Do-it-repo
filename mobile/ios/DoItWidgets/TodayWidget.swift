//
//  TodayWidget.swift
//  DoItWidgets
//
//  Widget displaying today's tasks with progress
//  Supports Small, Medium, and Large sizes
//

import WidgetKit
import SwiftUI

// MARK: - Widget Entry

struct TodayEntry: TimelineEntry {
    let date: Date
    let data: WidgetTodayData?
}

// MARK: - Widget Provider

struct TodayProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodayEntry {
        TodayEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        let entry = TodayEntry(
            date: Date(),
            data: WidgetDataProvider.shared.getTodayData()
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        let currentDate = Date()
        let data = WidgetDataProvider.shared.getTodayData()

        let entry = TodayEntry(date: currentDate, data: data)

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }
}

// MARK: - Widget Views

struct TodayWidgetSmallView: View {
    let entry: TodayEntry

    var body: some View {
        if let data = entry.data, let nextTask = data.nextTask {
            VStack(alignment: .leading, spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "calendar")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.blue)
                    Text("Aujourd'hui")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                    Spacer()
                }

                Spacer()

                // Next task
                VStack(alignment: .leading, spacing: 4) {
                    Text(nextTask.title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(2)

                    if let time = nextTask.formattedTime {
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.system(size: 10))
                            Text(time)
                                .font(.system(size: 11))
                        }
                        .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Count
                Text("\(data.totalCount - data.completedCount) tâche\(data.totalCount - data.completedCount > 1 ? "s" : "")")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .padding(16)
        } else {
            // Empty state
            VStack(spacing: 8) {
                Image(systemName: "checkmark.circle")
                    .font(.system(size: 32))
                    .foregroundColor(.green)
                Text("Aucune tâche")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct TodayWidgetMediumView: View {
    let entry: TodayEntry

    var body: some View {
        if let data = entry.data {
            VStack(alignment: .leading, spacing: 12) {
                // Header with progress
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "calendar")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.blue)
                        Text("Aujourd'hui")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.primary)
                    }

                    Spacer()

                    // Progress indicator
                    HStack(spacing: 3) {
                        ForEach(0..<5, id: \.self) { index in
                            Circle()
                                .fill(index < Int((Double(data.completedCount) / Double(data.totalCount)) * 5) ? Color.blue : Color.gray.opacity(0.3))
                                .frame(width: 6, height: 6)
                        }
                    }
                }

                // Tasks list (max 4)
                VStack(spacing: 8) {
                    ForEach(data.tasks.prefix(4)) { task in
                        HStack(spacing: 10) {
                            // Checkbox
                            Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 16))
                                .foregroundColor(task.completed ? .green : .gray)

                            // Task info
                            VStack(alignment: .leading, spacing: 2) {
                                Text(task.title)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(task.completed ? .secondary : .primary)
                                    .lineLimit(1)
                                    .strikethrough(task.completed)

                                if let time = task.formattedTime {
                                    Text(time)
                                        .font(.system(size: 10))
                                        .foregroundColor(.secondary)
                                }
                            }

                            Spacer()

                            // Priority indicator
                            Circle()
                                .fill(priorityColor(task.priority))
                                .frame(width: 8, height: 8)
                        }
                    }
                }

                Spacer()

                // Footer
                Text("\(data.completedCount)/\(data.totalCount) complétées")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .padding(16)
        } else {
            emptyStateView()
        }
    }

    private func priorityColor(_ priority: WidgetTaskData.Priority) -> Color {
        switch priority {
        case .high: return Color(hex: "EF4444")
        case .medium: return Color(hex: "F59E0B")
        case .low: return Color(hex: "10B981")
        }
    }

    private func emptyStateView() -> some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 40))
                .foregroundColor(.green)
            Text("Aucune tâche pour aujourd'hui")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.secondary)
            Text("Profitez de votre journée !")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct TodayWidgetLargeView: View {
    let entry: TodayEntry

    var body: some View {
        if let data = entry.data {
            VStack(alignment: .leading, spacing: 12) {
                // Header with progress bar
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        HStack(spacing: 6) {
                            Image(systemName: "calendar")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.blue)
                            Text("Aujourd'hui")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.primary)
                        }

                        Spacer()

                        Text("\(data.completedCount)/\(data.totalCount)")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.secondary)
                    }

                    // Progress bar
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 6)
                                .cornerRadius(3)

                            Rectangle()
                                .fill(Color.blue)
                                .frame(width: geometry.size.width * data.progressValue, height: 6)
                                .cornerRadius(3)
                        }
                    }
                    .frame(height: 6)
                }

                // Tasks list (max 8)
                VStack(spacing: 8) {
                    ForEach(data.tasks.prefix(8)) { task in
                        HStack(spacing: 10) {
                            // Checkbox
                            Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 16))
                                .foregroundColor(task.completed ? .green : .gray)

                            // Task info
                            VStack(alignment: .leading, spacing: 2) {
                                Text(task.title)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(task.completed ? .secondary : .primary)
                                    .lineLimit(1)
                                    .strikethrough(task.completed)

                                HStack(spacing: 8) {
                                    if let time = task.formattedTime {
                                        HStack(spacing: 3) {
                                            Image(systemName: "clock")
                                                .font(.system(size: 9))
                                            Text(time)
                                                .font(.system(size: 10))
                                        }
                                    }

                                    if let location = task.location {
                                        HStack(spacing: 3) {
                                            Image(systemName: "location")
                                                .font(.system(size: 9))
                                            Text(location.name)
                                                .font(.system(size: 10))
                                                .lineLimit(1)
                                        }
                                    }
                                }
                                .foregroundColor(.secondary)
                            }

                            Spacer()

                            // Priority badge
                            Circle()
                                .fill(priorityColor(task.priority))
                                .frame(width: 8, height: 8)
                        }
                    }
                }

                Spacer()

                // Footer with motivational message
                if data.progressPercentage >= 80 {
                    HStack {
                        Image(systemName: "star.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.yellow)
                        Text("Excellent progrès !")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                        Spacer()
                    }
                } else if data.progressPercentage >= 50 {
                    HStack {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.orange)
                        Text("Vous êtes sur la bonne voie")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                        Spacer()
                    }
                }
            }
            .padding(16)
        } else {
            emptyStateView()
        }
    }

    private func priorityColor(_ priority: WidgetTaskData.Priority) -> Color {
        switch priority {
        case .high: return Color(hex: "EF4444")
        case .medium: return Color(hex: "F59E0B")
        case .low: return Color(hex: "10B981")
        }
    }

    private func emptyStateView() -> some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 50))
                .foregroundColor(.green)

            VStack(spacing: 8) {
                Text("Journée terminée !")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                Text("Vous avez complété toutes vos tâches")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Text("🎉")
                .font(.system(size: 32))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Configuration

struct TodayWidget: Widget {
    let kind: String = "TodayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TodayProvider()) { entry in
            TodayWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Tâches du Jour")
        .description("Affiche vos tâches d'aujourd'hui avec progression")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct TodayWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: TodayProvider.Entry

    var body: some View {
        ZStack {
            // Background
            Color("WidgetBackground")

            // Content based on size
            switch family {
            case .systemSmall:
                TodayWidgetSmallView(entry: entry)
                    .widgetURL(DeepLink.today.url)
            case .systemMedium:
                TodayWidgetMediumView(entry: entry)
                    .widgetURL(DeepLink.today.url)
            case .systemLarge:
                TodayWidgetLargeView(entry: entry)
                    .widgetURL(DeepLink.today.url)
            @unknown default:
                TodayWidgetSmallView(entry: entry)
            }
        }
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Preview

struct TodayWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Small preview
            TodayWidgetEntryView(entry: TodayEntry(date: Date(), data: mockData()))
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            // Medium preview
            TodayWidgetEntryView(entry: TodayEntry(date: Date(), data: mockData()))
                .previewContext(WidgetPreviewContext(family: .systemMedium))

            // Large preview
            TodayWidgetEntryView(entry: TodayEntry(date: Date(), data: mockData()))
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }

    static func mockData() -> WidgetTodayData {
        WidgetTodayData(
            tasks: [
                WidgetTaskData(id: "1", title: "Faire les courses", completed: false, priority: .high, category: "Shopping", startDate: "2025-12-13T10:00:00Z", duration: 30, location: WidgetTaskData.Location(name: "Supermarché")),
                WidgetTaskData(id: "2", title: "Réunion projet", completed: false, priority: .medium, category: "Work", startDate: "2025-12-13T14:30:00Z", duration: 60, location: nil),
                WidgetTaskData(id: "3", title: "Sport", completed: true, priority: .low, category: "Health", startDate: "2025-12-13T18:00:00Z", duration: 45, location: nil),
                WidgetTaskData(id: "4", title: "Appeler maman", completed: false, priority: .medium, category: "Personal", startDate: nil, duration: 15, location: nil)
            ],
            completedCount: 1,
            totalCount: 4,
            progressPercentage: 25,
            nextTask: WidgetTaskData(id: "1", title: "Faire les courses", completed: false, priority: .high, category: "Shopping", startDate: "2025-12-13T10:00:00Z", duration: 30, location: WidgetTaskData.Location(name: "Supermarché")),
            lastUpdated: "2025-12-13T09:00:00Z"
        )
    }
}
