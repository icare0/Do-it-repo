//
//  NextTaskWidget.swift
//  DoItWidgets
//
//  Widget displaying the next urgent task
//  Small size only
//

import WidgetKit
import SwiftUI

// MARK: - Widget Entry

struct NextTaskEntry: TimelineEntry {
    let date: Date
    let task: WidgetTaskData?
}

// MARK: - Widget Provider

struct NextTaskProvider: TimelineProvider {
    func placeholder(in context: Context) -> NextTaskEntry {
        NextTaskEntry(date: Date(), task: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (NextTaskEntry) -> Void) {
        let entry = NextTaskEntry(
            date: Date(),
            task: WidgetDataProvider.shared.getNextTaskData()
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NextTaskEntry>) -> Void) {
        let currentDate = Date()
        let task = WidgetDataProvider.shared.getNextTaskData()

        let entry = NextTaskEntry(date: currentDate, task: task)

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }
}

// MARK: - Widget View

struct NextTaskWidgetView: View {
    let entry: NextTaskEntry

    var body: some View {
        if let task = entry.task {
            ZStack {
                // Background gradient based on priority
                LinearGradient(
                    gradient: Gradient(colors: [
                        priorityColor(task.priority).opacity(0.15),
                        Color("WidgetBackground")
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                VStack(alignment: .leading, spacing: 8) {
                    // Priority badge
                    HStack {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(priorityColor(task.priority))
                                .frame(width: 8, height: 8)
                            Text(priorityLabel(task.priority))
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(priorityColor(task.priority))
                                .textCase(.uppercase)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(priorityColor(task.priority).opacity(0.15))
                        .cornerRadius(8)

                        Spacer()

                        // Category icon
                        if let category = task.category {
                            Image(systemName: categoryIcon(category))
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    // Task title
                    Text(task.title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.primary)
                        .lineLimit(3)
                        .minimumScaleFactor(0.8)

                    Spacer()

                    // Time and location
                    VStack(alignment: .leading, spacing: 4) {
                        if let time = task.formattedTime {
                            HStack(spacing: 4) {
                                Image(systemName: "clock.fill")
                                    .font(.system(size: 11))
                                Text(time)
                                    .font(.system(size: 13, weight: .semibold))
                            }
                            .foregroundColor(priorityColor(task.priority))
                        }

                        if let location = task.location {
                            HStack(spacing: 4) {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 10))
                                Text(location.name)
                                    .font(.system(size: 11))
                                    .lineLimit(1)
                            }
                            .foregroundColor(.secondary)
                        }

                        if let duration = task.duration {
                            HStack(spacing: 4) {
                                Image(systemName: "timer")
                                    .font(.system(size: 10))
                                Text("\(duration) min")
                                    .font(.system(size: 11))
                            }
                            .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(16)
            }
        } else {
            // Empty state
            VStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 36))
                    .foregroundColor(.green)

                Text("Aucune tâche")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)

                Text("Vous êtes à jour !")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private func priorityColor(_ priority: WidgetTaskData.Priority) -> Color {
        switch priority {
        case .high: return Color(hex: "EF4444")
        case .medium: return Color(hex: "F59E0B")
        case .low: return Color(hex: "10B981")
        }
    }

    private func priorityLabel(_ priority: WidgetTaskData.Priority) -> String {
        switch priority {
        case .high: return "Urgent"
        case .medium: return "Moyen"
        case .low: return "Faible"
        }
    }

    private func categoryIcon(_ category: String) -> String {
        switch category.lowercased() {
        case "work", "travail": return "briefcase.fill"
        case "shopping", "courses": return "cart.fill"
        case "health", "santé", "sport": return "heart.fill"
        case "personal", "personnel": return "person.fill"
        case "home", "maison": return "house.fill"
        default: return "folder.fill"
        }
    }
}

// MARK: - Widget Configuration

struct NextTaskWidget: Widget {
    let kind: String = "NextTaskWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextTaskProvider()) { entry in
            NextTaskWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Prochaine Tâche")
        .description("Affiche votre tâche la plus urgente")
        .supportedFamilies([.systemSmall])
    }
}

struct NextTaskWidgetEntryView: View {
    var entry: NextTaskProvider.Entry

    var body: some View {
        ZStack {
            Color("WidgetBackground")
            NextTaskWidgetView(entry: entry)
                .widgetURL(entry.task.map { DeepLink.task(id: $0.id).url } ?? DeepLink.today.url)
        }
    }
}

// MARK: - Preview

struct NextTaskWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // With urgent task
            NextTaskWidgetEntryView(entry: NextTaskEntry(
                date: Date(),
                task: WidgetTaskData(
                    id: "1",
                    title: "Réunion importante avec le client",
                    completed: false,
                    priority: .high,
                    category: "Work",
                    startDate: "2025-12-13T14:30:00Z",
                    duration: 60,
                    location: WidgetTaskData.Location(name: "Bureau")
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            // With medium priority task
            NextTaskWidgetEntryView(entry: NextTaskEntry(
                date: Date(),
                task: WidgetTaskData(
                    id: "2",
                    title: "Faire les courses",
                    completed: false,
                    priority: .medium,
                    category: "Shopping",
                    startDate: "2025-12-13T16:00:00Z",
                    duration: 30,
                    location: WidgetTaskData.Location(name: "Supermarché")
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            // Empty state
            NextTaskWidgetEntryView(entry: NextTaskEntry(date: Date(), task: nil))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
        }
    }
}
