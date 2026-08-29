import SwiftUI

struct RootTabs: View {
    @AppStorage("fg-focus") private var focus = false

    var body: some View {
        TabView {
            ReadView()
                .tabItem { Label("Read", systemImage: "book") }
            SearchView()
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
            AboutView()
                .tabItem { Label("About", systemImage: "info.circle") }
            GiveView()
                .tabItem { Label("Give", systemImage: "heart") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
        .toolbar(focus ? .hidden : .visible, for: .tabBar)
    }
}
