import SwiftUI

@main
struct PibliaApp: App {
    var body: some Scene {
        WindowGroup {
            RootTabs()
                .tint(PibliaTheme.burgundy)
        }
    }
}
