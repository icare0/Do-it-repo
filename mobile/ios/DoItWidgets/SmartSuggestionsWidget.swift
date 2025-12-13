//
//  SmartSuggestionsWidget.swift
//  DoItWidgets
//
//  Widget displaying smart optimization suggestions
//  Medium size only
//

import WidgetKit
import SwiftUI

// MARK: - Widget Entry

struct SuggestionsEntry: TimelineEntry {
    let date: Date
    let data: WidgetSuggestionsData?
}

// MARK: - Widget Provider

struct SuggestionsProvider: TimelineProvider {
    func placeholder(in context: Context) -> SuggestionsEntry {
        SuggestionsEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SuggestionsEntry) -> Void) {
        let entry = SuggestionsEntry(
            date: Date(),
            data: WidgetDataProvider.shared.getSuggestionsData()
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SuggestionsEntry>) -> Void) {
        let currentDate = Date()
        let data = WidgetDataProvider.shared.getSuggestionsData()

        let entry = SuggestionsEntry(date: currentDate, data: data)

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }
}

// MARK: - Widget View

struct SmartSuggestionsWidgetView: View {
    let entry: SuggestionsEntry

    var body: some View {
        if let data = entry.data, !data.suggestions.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.indigo)
                    Text("Assistant Intelligent")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.primary)

                    Spacer()

                    // Count badge
                    Text("\(data.suggestions.count)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 24, height: 24)
                        .background(Color.indigo)
                        .clipShape(Circle())
                }

                // Top suggestion (primary)
                if let topSuggestion = data.suggestions.first {
                    VStack(alignment: .leading, spacing: 8) {
                        // Type and confidence
                        HStack {
                            HStack(spacing: 4) {
                                Image(systemName: suggestionIcon(topSuggestion.type))
                                    .font(.system(size: 11))
                                Text(suggestionTypeLabel(topSuggestion.type))
                                    .font(.system(size: 11, weight: .semibold))
                            }
                            .foregroundColor(priorityColor(topSuggestion.priority))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(priorityColor(topSuggestion.priority).opacity(0.15))
                            .cornerRadius(8)

                            Spacer()

                            // Confidence indicator
                            HStack(spacing: 2) {
                                ForEach(0..<3, id: \.self) { index in
                                    Circle()
                                        .fill(index < confidenceLevel(topSuggestion.confidence) ? Color.indigo : Color.gray.opacity(0.3))
                                        .frame(width: 5, height: 5)
                                }
                            }
                        }

                        // Title
                        Text(topSuggestion.title)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.primary)
                            .lineLimit(2)

                        // Impact metrics
                        if let impact = topSuggestion.impact {
                            HStack(spacing: 12) {
                                if let timeSaved = impact.timeSaved {
                                    HStack(spacing: 4) {
                                        Image(systemName: "clock.arrow.circlepath")
                                            .font(.system(size: 10))
                                        Text("+\(timeSaved) min")
                                            .font(.system(size: 11, weight: .medium))
                                    }
                                    .foregroundColor(.green)
                                }

                                if let distanceSaved = impact.distanceSaved {
                                    HStack(spacing: 4) {
                                        Image(systemName: "arrow.triangle.swap")
                                            .font(.system(size: 10))
                                        Text("-\(String(format: "%.1f", distanceSaved)) km")
                                            .font(.system(size: 11, weight: .medium))
                                    }
                                    .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                    .padding(12)
                    .background(Color.indigo.opacity(0.08))
                    .cornerRadius(12)
                }

                // Additional suggestions preview (compact)
                if data.suggestions.count > 1 {
                    VStack(spacing: 6) {
                        ForEach(data.suggestions.dropFirst().prefix(2)) { suggestion in
                            HStack(spacing: 8) {
                                Image(systemName: suggestionIcon(suggestion.type))
                                    .font(.system(size: 11))
                                    .foregroundColor(priorityColor(suggestion.priority))
                                    .frame(width: 20)

                                Text(suggestion.title)
                                    .font(.system(size: 12))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.vertical, 6)
                            .padding(.horizontal, 10)
                            .background(Color.gray.opacity(0.08))
                            .cornerRadius(8)
                        }
                    }
                }

                // Footer
                if data.suggestions.count > 3 {
                    Text("+\(data.suggestions.count - 3) autres suggestions")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 4)
                }
            }
            .padding(16)
        } else {
            emptyStateView()
        }
    }

    private func suggestionIcon(_ type: WidgetSuggestionData.SuggestionType) -> String {
        switch type {
        case .reschedule: return "calendar.badge.clock"
        case .reorder: return "arrow.up.arrow.down"
        case .group: return "square.stack.3d.up"
        case .skip: return "forward.fill"
        case .split: return "scissors"
        case .combine: return "link"
        }
    }

    private func suggestionTypeLabel(_ type: WidgetSuggestionData.SuggestionType) -> String {
        switch type {
        case .reschedule: return "Reprogrammer"
        case .reorder: return "Réorganiser"
        case .group: return "Grouper"
        case .skip: return "Reporter"
        case .split: return "Diviser"
        case .combine: return "Combiner"
        }
    }

    private func priorityColor(_ priority: WidgetSuggestionData.Priority) -> Color {
        switch priority {
        case .critical: return Color(hex: "DC2626")
        case .high: return Color(hex: "F59E0B")
        case .medium: return Color(hex: "3B82F6")
        case .low: return Color(hex: "6B7280")
        }
    }

    private func confidenceLevel(_ confidence: Int) -> Int {
        if confidence >= 80 {
            return 3
        } else if confidence >= 60 {
            return 2
        } else {
            return 1
        }
    }

    private func emptyStateView() -> some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 40))
                .foregroundColor(.green)

            VStack(spacing: 4) {
                Text("Tout est optimal !")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                Text("Aucune suggestion d'optimisation pour le moment")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Configuration

struct SmartSuggestionsWidget: Widget {
    let kind: String = "SmartSuggestionsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SuggestionsProvider()) { entry in
            SmartSuggestionsWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Suggestions Intelligentes")
        .description("Affiche les suggestions d'optimisation de l'assistant")
        .supportedFamilies([.systemMedium])
    }
}

struct SmartSuggestionsWidgetEntryView: View {
    var entry: SuggestionsProvider.Entry

    var body: some View {
        ZStack {
            Color("WidgetBackground")
            SmartSuggestionsWidgetView(entry: entry)
                .widgetURL(DeepLink.smartAssistant.url)
        }
    }
}

// MARK: - Preview

struct SmartSuggestionsWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // With suggestions
            SmartSuggestionsWidgetEntryView(entry: SuggestionsEntry(
                date: Date(),
                data: WidgetSuggestionsData(
                    suggestions: [
                        WidgetSuggestionData(
                            id: "1",
                            type: .reorder,
                            title: "Regroupez vos courses pour économiser 2.5 km",
                            confidence: 92,
                            priority: .high,
                            impact: WidgetSuggestionData.Impact(
                                timeSaved: 15,
                                distanceSaved: 2.5
                            )
                        ),
                        WidgetSuggestionData(
                            id: "2",
                            type: .reschedule,
                            title: "Déplacez la réunion projet à 14h30",
                            confidence: 78,
                            priority: .medium,
                            impact: WidgetSuggestionData.Impact(
                                timeSaved: 30,
                                distanceSaved: nil
                            )
                        ),
                        WidgetSuggestionData(
                            id: "3",
                            type: .group,
                            title: "Groupez 3 tâches au bureau",
                            confidence: 85,
                            priority: .medium,
                            impact: nil
                        ),
                        WidgetSuggestionData(
                            id: "4",
                            type: .split,
                            title: "Divisez 'Grand projet' en sous-tâches",
                            confidence: 65,
                            priority: .low,
                            impact: nil
                        )
                    ],
                    totalSuggestions: 4,
                    highPriorityCount: 1,
                    lastUpdated: "2025-12-13T09:00:00Z"
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("With Suggestions")

            // Empty state
            SmartSuggestionsWidgetEntryView(entry: SuggestionsEntry(date: Date(), data: nil))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Empty State")
        }
    }
}
