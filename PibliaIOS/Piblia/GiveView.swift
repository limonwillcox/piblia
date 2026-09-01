import SwiftUI

struct GiveView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Give",
                systemImage: "heart",
                description: Text("Donation link is not set yet. Same as the website Give tab.")
            )
            .navigationTitle("Give")
        }
    }
}
