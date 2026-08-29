import SwiftUI

struct ReadView: View {
    @AppStorage("fg-latin") private var latin = false
    @AppStorage("fg-focus") private var focus = false
    @AppStorage("fg-liber") private var liber = 1
    @AppStorage("fg-bookmarks") private var bookmarksRaw = ""

    @State private var showLibri = false

    private var bookmarked: Set<Int> {
        Set(bookmarksRaw.split(separator: ",").compactMap { Int($0) })
    }

    private var passage: Passage {
        SampleCorpus.passage(workId: SampleCorpus.confessions.id, liber: liber)
    }

    private var paras: [String] {
        latin ? passage.latin : passage.english
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text(passage.heading)
                        .font(.pibliaSerif(22, weight: .semibold))
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(Array(paras.enumerated()), id: \.offset) { i, text in
                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            Text("\(i + 1)")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(.secondary)
                            Text(text)
                                .font(.pibliaSerif(19))
                                .lineSpacing(6)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .background(Color(.systemBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if !focus {
                        HStack(spacing: 6) {
                            pill(SampleCorpus.augustine.short)
                            pill(SampleCorpus.confessions.short)
                            Button { showLibri = true } label: {
                                pillLabel(Liber.label(liber))
                            }
                            Button {
                                latin.toggle()
                            } label: {
                                Text("☧")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(latin ? PibliaTheme.burgundy : Color.primary)
                            }
                            .accessibilityLabel("Latin")
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 8) {
                        Button {
                            toggleBookmark()
                        } label: {
                            Image(systemName: bookmarked.contains(liber) ? "bookmark.fill" : "bookmark")
                                .foregroundStyle(PibliaTheme.burgundy)
                        }
                        .accessibilityLabel("Bookmark")
                        Button {
                            focus.toggle()
                        } label: {
                            Image(systemName: focus ? "cross.fill" : "cross")
                                .foregroundStyle(focus ? PibliaTheme.wood : Color.primary)
                        }
                        .accessibilityLabel("Focus")
                    }
                }
            }
            .sheet(isPresented: $showLibri) {
                NavigationStack {
                    List(1...SampleCorpus.confessions.liberCount, id: \.self) { n in
                        Button {
                            liber = n
                            showLibri = false
                        } label: {
                            HStack {
                                Text(Liber.label(n))
                                    .foregroundStyle(Color.primary)
                                if n == liber { Spacer(); Image(systemName: "checkmark") }
                                else if bookmarked.contains(n) {
                                    Spacer()
                                    Circle().fill(PibliaTheme.burgundy).frame(width: 7, height: 7)
                                }
                            }
                        }
                    }
                    .navigationTitle("Section")
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Done") { showLibri = false }
                        }
                    }
                }
                .presentationDetents([.medium, .large])
            }
        }
    }

    private func pill(_ title: String) -> some View {
        pillLabel(title)
    }

    private func pillLabel(_ title: String) -> some View {
        HStack(spacing: 2) {
            Text(title)
            Image(systemName: "chevron.down")
                .font(.system(size: 10, weight: .semibold))
        }
        .font(.system(size: 14, weight: .semibold))
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(Color(.secondarySystemBackground), in: Capsule())
    }

    private func toggleBookmark() {
        var set = bookmarked
        if set.contains(liber) { set.remove(liber) } else { set.insert(liber) }
        bookmarksRaw = set.sorted().map(String.init).joined(separator: ",")
    }
}
