TM CLUB VOTE — Offline Voting PWA
=================================

A tiny, offline-first web app for running club award votes (Best Speaker,
Best Evaluator, Best Table Topics Speaker, Best Major/Minor Role Player, and
any custom categories you add). One shared phone or tablet is passed around;
each member taps their picks and hands it on. Winners can be revealed on the
device or exported as an image / text to share.

Everything runs on the device. No internet is needed at the meeting, no
accounts, no data leaves the phone.


FILES IN THIS FOLDER
--------------------
  index.html               The whole app (HTML, CSS, JavaScript in one file)
  manifest.webmanifest     PWA metadata (name, icons, colours)
  sw.js                    Service worker — caches the app for offline use
  icon-192.png             App icon (192x192)
  icon-512.png             App icon (512x512)
  icon-maskable-512.png    Maskable icon for Android adaptive icons
  apple-touch-icon.png     Home-screen icon for iPhone/iPad
  favicon-32.png           Browser tab icon
  README.txt               This file

There is no build step and there are no dependencies. The files are served
exactly as they are.


INSTALL ON A PHONE (optional but recommended)
---------------------------------------------
Open the GitHub Pages URL on the meeting phone/tablet WHILE YOU HAVE INTERNET,
then add it to the home screen:
  - iPhone/iPad (Safari): Share button > "Add to Home Screen".
  - Android (Chrome): menu (three dots) > "Install app" / "Add to Home screen".

After that it launches full-screen like a normal app and works with NO
internet at the venue. You can also just use it in a browser tab — installing
only adds the home-screen icon and full-screen launch.


USING THE APP
-------------
  Gear icon (top-right)  Organizer area: Setup and Results.
  Setup                  Enter club name, theme, meeting number, date, and
                         (optional) Toastmaster of the Day. Add categories and
                         type the nominees for each, one name per line.
  Vote                   Pass the device around. Each member taps one name per
                         category, then taps the big "Submit my vote" button
                         before handing it to the next person.
  Results                Reveal winners one at a time or all at once. Share the
                         winners as text or as a downloadable image. Vote counts
                         are shown to the organizer here but are NEVER included
                         in anything shared.

Organizer passcode: In Setup you can set a passcode. Once set, the gear and the
Results screen ask for it, so voters can only ever reach the voting screen.
Leave it blank for no lock. (This keeps casual voters out; it is not bank-grade
security. If you forget it, clearing the site's data in the browser resets it —
which also clears the ballots — so jot it down somewhere.)

Data is saved on the device automatically and survives a refresh. Use
"Clear ballots & start a new meeting" in Setup between meetings.


UPDATING THE APP LATER
----------------------
If you change any file and re-upload:
  - Open  service-workerw.js  and bump the cache name, e.g. change
        const CACHE = "clubvote-v2";
    to  "clubvote-v3".
  - This makes installed devices download the new version on their next
    online visit (the old cache is cleared automatically).
  - If you also changed the app NAME or icons, remove the old home-screen
    icon and re-add it, because phones cache those at install time.


That's it. Enjoy your meeting!
