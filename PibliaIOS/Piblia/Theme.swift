import SwiftUI

enum PibliaTheme {
    static let burgundy = Color(red: 0.58, green: 0.13, blue: 0.02)
    static let burgundyDeep = Color(red: 0.44, green: 0.09, blue: 0.01)
    static let gold = Color(red: 0.95, green: 0.89, blue: 0.66)
    static let wood = Color(red: 0.48, green: 0.29, blue: 0.16)
}

extension Font {
    static func pibliaSerif(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }
}
