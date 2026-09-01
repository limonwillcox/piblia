import SwiftUI

struct SettingsView: View {
    @AppStorage("fg-latin") private var latin = false
    @AppStorage("fg-focus") private var focus = false
    @AppStorage("englishOn") private var englishOn = true
    @AppStorage("latinOn") private var latinOn = true
    @AppStorage("bibleOn") private var bibleOn = true
    @AppStorage("notesOn") private var notesOn = true

    var body: some View {
        NavigationStack {
            Form {
                Section("Reading") {
                    Toggle("Latin (Chi-Rho)", isOn: $latin)
                    Toggle("Focus mode", isOn: $focus)
                }
                Section {
                    Toggle("English", isOn: $englishOn)
                    Toggle("Latin", isOn: $latinOn)
                    Toggle("Bible", isOn: $bibleOn)
                    Toggle("Notes", isOn: $notesOn)
                } header: {
                    Text("Parallel sources")
                } footer: {
                    Text("Used in Goal 3. Each half of the screen cycles through what the other half is not showing.")
                }
                Section("Credits") {
                    Text("English: E. B. Pusey, 1838, public domain. Latin: Confessiones. KJV: public domain. Not affiliated with YouVersion or Bible Gateway.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
        }
    }
}
