# Archived features

Parked on purpose, not deleted.

## iOS web reader (`archive/ios-web/`)

The YouVersion-style phone shell we built in the browser: top bar, bottom tabs,
focus cross, Chi-Rho, L/R parallel cycle, notes, bookmarks, KJV pane.

Phones on the live site now go to `get-app.html` and are asked to use the
App Store app. The Swift project is `PibliaIOS/`.

To restore the web phone shell: move `archive/ios-web/` back to `ios/`, restore
`js/ios.js` and `js/parallel.js` from `archive/ios-web/from-root/`, and point
the HTML pages at those scripts instead of `js/gate.js`.

## Reading plans

The old `plans.html` page was removed with the static frontend. Nothing in the main navigation or footer links here.

To restore: add a Plans route and a left-rail item in the React app.

## Audio

The listen button and homepage audio note were removed from the reader chrome. There was never a real audio corpus.

To restore: add an audio control on the reading toolbar in `renderRead()`.
