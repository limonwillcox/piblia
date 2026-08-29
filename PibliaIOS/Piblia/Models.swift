import Foundation

struct Father: Identifiable, Hashable {
    let id: String
    let name: String
    var short: String {
        if let of = name.split(separator: " of ").first { return String(of) }
        return name.split(separator: " ").first.map(String.init) ?? name
    }
}

struct Work: Identifiable, Hashable {
    let id: String
    let fatherId: String
    let title: String
    let short: String
    let liberCount: Int
}

struct Passage: Identifiable, Hashable {
    let id: String
    let workId: String
    let liber: Int
    let heading: String
    let english: [String]
    let latin: [String]
}

enum PaneSource: String, CaseIterable, Identifiable {
    case english, latin, bible, notes
    var id: String { rawValue }
    var label: String {
        switch self {
        case .english: return "English"
        case .latin: return "Latin"
        case .bible: return "Bible"
        case .notes: return "Notes"
        }
    }
}

enum Liber {
    static let roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"]
    static func label(_ n: Int) -> String {
        "Liber " + (n >= 1 && n <= roman.count ? roman[n - 1] : "\(n)")
    }
}
