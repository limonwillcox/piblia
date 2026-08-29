import Foundation

enum SampleCorpus {
    static let augustine = Father(id: "augustine", name: "Augustine of Hippo")

    static let confessions = Work(
        id: "confessions",
        fatherId: "augustine",
        title: "The Confessions",
        short: "Confessions",
        liberCount: 13
    )

    static let liberI = Passage(
        id: "confessions-1",
        workId: "confessions",
        liber: 1,
        heading: "Book I",
        english: [
            "Great art Thou, O Lord, and greatly to be praised; great is Thy power, and Thy wisdom infinite.",
            "And Thee would man praise; man, but a particle of Thy creation; man, that bears about him his mortality, the witness of his sin, the witness that Thou resistest the proud: yet would man praise Thee; he, but a particle of Thy creation.",
            "Thou awakest us to delight in Thy praise; for Thou madest us for Thyself, and our heart is restless, until it repose in Thee.",
            "Grant me, Lord, to know and understand which is first, to call on Thee or to praise Thee? and, again, to know Thee or to call on Thee? for who can call on Thee, not knowing Thee?",
            "For he that knoweth Thee not may call on Thee as other than Thou art. Or, is it rather, that we call on Thee that we may know Thee?"
        ],
        latin: [
            "Magnus es, domine, et laudabilis valde: magna virtus tua, et sapientiae tuae non est numerus.",
            "Et laudare te vult homo, aliqua portio creaturae tuae, et homo circumferens mortalitatem suam, circumferens testimonium peccati sui et testimonium quia superbis resistis: et tamen laudare te vult homo, aliqua portio creaturae tuae.",
            "Tu excitas, ut laudare te delectet, quia fecisti nos ad te et inquietum est cor nostrum, donec requiescat in te.",
            "Da mihi, domine, scire et intellegere, utrum sit prius invocare te an laudare te, et scire te prius sit an invocare te. sed quis te invocat nesciens te?",
            "Aliud enim pro alio potest invocare nesciens. an potius invocaris, ut sciaris?"
        ]
    )

    static func passage(workId: String, liber: Int) -> Passage {
        if workId == confessions.id && liber == 1 { return liberI }
        return Passage(
            id: "\(workId)-\(liber)",
            workId: workId,
            liber: liber,
            heading: Liber.label(liber),
            english: ["This Liber is not in the bundled sample yet. Goal 1 ships Liber I. Later goals load the rest of the corpus."],
            latin: ["Hic liber in exemplo nondum est."]
        )
    }
}
