//
//  WidgetDataProvider.swift
//  DoItWidgets
//
//  Provides data from React Native app to iOS widgets via App Group
//

import Foundation

// App Group ID (must match React Native side)
let APP_GROUP_ID = "group.com.doit.app"

// MARK: - Data Models

struct WidgetTaskData: Codable, Identifiable {
    let id: String
    let title: String
    let completed: Bool
    let priority: Priority
    let category: String?
    let startDate: String?
    let duration: Int?
    let location: Location?

    enum Priority: String, Codable {
        case low, medium, high

        var color: String {
            switch self {
            case .high: return "EF4444"
            case .medium: return "F59E0B"
            case .low: return "10B981"
            }
        }
    }

    struct Location: Codable {
        let name: String
    }

    var formattedTime: String? {
        guard let startDate = startDate,
              let date = ISO8601DateFormatter().date(from: startDate) else {
            return nil
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

struct WidgetTodayData: Codable {
    let tasks: [WidgetTaskData]
    let completedCount: Int
    let totalCount: Int
    let progressPercentage: Int
    let nextTask: WidgetTaskData?
    let lastUpdated: String

    var progressValue: Double {
        return totalCount > 0 ? Double(completedCount) / Double(totalCount) : 0
    }
}

struct WidgetStatsData: Codable {
    let currentStreak: Int
    let longestStreak: Int
    let todayCompleted: Int
    let todayTotal: Int
    let weeklyProgress: [Int]
    let lastUpdated: String
}

struct WidgetSuggestionData: Codable, Identifiable {
    let id: String
    let title: String
    let message: String
    let priority: String
    let type: String
    let impact: Impact?

    struct Impact: Codable {
        let timeSaved: Int?
        let distanceSaved: Int?
    }

    var impactText: String? {
        var parts: [String] = []

        if let time = impact?.timeSaved {
            parts.append("⏱️ \(time) min")
        }

        if let distance = impact?.distanceSaved {
            let km = Double(distance) / 1000.0
            parts.append("🚗 \(String(format: "%.1f", km)) km")
        }

        return parts.isEmpty ? nil : parts.joined(separator: " • ")
    }
}

struct WidgetSuggestionsData: Codable {
    let suggestions: [WidgetSuggestionData]
    let unviewedCount: Int
    let lastUpdated: String
}

// MARK: - Widget Data Provider

class WidgetDataProvider {
    static let shared = WidgetDataProvider()

    private let userDefaults: UserDefaults?

    private init() {
        userDefaults = UserDefaults(suiteName: APP_GROUP_ID)
    }

    // MARK: - Data Keys

    private enum Keys {
        static let today = "widget_today_data"
        static let nextTask = "widget_next_task_data"
        static let stats = "widget_stats_data"
        static let suggestions = "widget_suggestions_data"
        static let lastUpdate = "widget_last_update"
    }

    // MARK: - Get Data

    func getTodayData() -> WidgetTodayData? {
        return loadData(key: Keys.today)
    }

    func getNextTaskData() -> WidgetTaskData? {
        return loadData(key: Keys.nextTask)
    }

    func getStatsData() -> WidgetStatsData? {
        return loadData(key: Keys.stats)
    }

    func getSuggestionsData() -> WidgetSuggestionsData? {
        return loadData(key: Keys.suggestions)
    }

    func getLastUpdateDate() -> Date? {
        guard let dateString: String = loadData(key: Keys.lastUpdate),
              let date = ISO8601DateFormatter().date(from: dateString) else {
            return nil
        }
        return date
    }

    // MARK: - Helpers

    private func loadData<T: Decodable>(key: String) -> T? {
        guard let userDefaults = userDefaults,
              let jsonString = userDefaults.string(forKey: key),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }

        let decoder = JSONDecoder()
        do {
            return try decoder.decode(T.self, from: jsonData)
        } catch {
            print("Error decoding \(key): \(error)")
            return nil
        }
    }
}

// MARK: - URL Scheme for Deep Linking

enum DeepLink {
    case today
    case task(id: String)
    case stats
    case smartAssistant
    case quickAdd

    var url: URL? {
        let baseURL = "doit://"
        switch self {
        case .today:
            return URL(string: "\(baseURL)today")
        case .task(let id):
            return URL(string: "\(baseURL)task/\(id)")
        case .stats:
            return URL(string: "\(baseURL)stats")
        case .smartAssistant:
            return URL(string: "\(baseURL)smart-assistant")
        case .quickAdd:
            return URL(string: "\(baseURL)quick-add")
        }
    }
}
