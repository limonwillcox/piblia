import SwiftUI

struct SearchView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Search waits on Goal 4",
                systemImage: "magnifyingglass",
                description: Text("The web search is archived. Native search ships when the library grows past Confessions.")
            )
            .navigationTitle("Search")
        }
    }
}
