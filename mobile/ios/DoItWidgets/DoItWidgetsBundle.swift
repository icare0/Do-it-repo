//
//  DoItWidgetsBundle.swift
//  DoItWidgets
//
//  Main widget bundle containing all Do-It widgets
//

import WidgetKit
import SwiftUI

@main
struct DoItWidgetsBundle: WidgetBundle {
    var body: some Widget {
        TodayWidget()
        NextTaskWidget()
        StatsWidget()
        SmartSuggestionsWidget()
    }
}
