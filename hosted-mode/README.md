TM CLUB VOTE — Hosted Mode (independent voting, still fully offline)
=====================================================================

This is a second way to run club award votes, for when members don't want
to pass around one shared device. Instead, every member votes privately on
their OWN phone. It still needs **no internet at all** — voters connect to
a local Wi-Fi network that the host device creates or joins, and everything
is served from that host, right there in the room. Nothing goes further
than that local network; there is no cloud, no accounts, no data usage.

You can host this from **either**:
  - **Option A: the organizer's Android phone**, via Termux (a free
    terminal app) — good if you don't want to bring a laptop.
  - **Option B: a laptop** (Mac, Windows, or Linux) — usually simpler,
    since laptops run Node.js directly with no extra app needed. Use this
    if you have a laptop handy.

Either way, voters can be on iPhone or Android — they just open a browser,
nothing to install. If you'd rather not do either of these and don't mind
one shared device, use the original app in the parent folder instead — it
needs zero setup.


HOW IT WORKS
------------
  1. The host device (organizer's Android phone, or a laptop) runs a tiny
     local server.
  2. A local Wi-Fi network exists for everyone to join — either the host
     phone's Personal Hotspot, a laptop acting as its own hotspot, or an
     ordinary Wi-Fi router at the venue (internet access is not required
     for any of these — just the local network).
  3. Everyone else joins that Wi-Fi and opens a web address in their own
     phone's browser (Safari, Chrome, whatever they normally use).
  4. Each person votes privately. Their phone sends the ballot straight to
     the host device over the local network — never over the internet.
  5. The organizer opens the same address (with a passcode) to see live
     results, reveal winners, and share/export exactly like the original
     app.


OPTION A: HOST FROM AN ANDROID PHONE (via Termux)
--------------------------------------------------
One-time setup:
  1. Install **Termux** from F-Droid: https://f-droid.org/packages/com.termux/
     (Not the Play Store version — it's outdated and unsupported.)
  2. Open Termux and run:
         pkg update && pkg install nodejs -y
  3. Get this `hosted-mode` folder onto the phone. Easiest ways:
       - Download the whole project as a zip from GitHub on the phone and
         extract it (any file manager can unzip), OR
       - `git clone` the repo inside Termux if you have `git` set up.
     Make a note of the folder's path, e.g.
         /storage/emulated/0/Download/toastmasters-voting-pwa/hosted-mode
  4. In Termux, if your files are outside Termux's own storage, run once:
         termux-setup-storage
     (grants Termux permission to see your phone's Downloads/etc.)
  5. `cd` into the `hosted-mode` folder, e.g.:
         cd /storage/emulated/0/Download/toastmasters-voting-pwa/hosted-mode
  6. Test it:
         node server.js
     You should see "TM Club Vote — hosted mode ... Server listening on
     port 3000". Leave this running, then Ctrl+C to stop the test.

That's the whole setup. You only need to do steps 1–2 once ever, and step 3
once per phone (unless you update the files later).

At the meeting:
  1. Turn on this phone's **Personal Hotspot / Portable Wi-Fi hotspot**
     (Settings > Network > Hotspot). Data/SIM can be off — you only need
     the local Wi-Fi radio, not internet.
  2. Open Termux, `cd` to the `hosted-mode` folder, run `node server.js`.
  3. Find this phone's hotspot IP address. Usually shown right on the
     hotspot settings screen, or run in Termux:
         ip addr show wlan0
     Look for something like `192.168.43.1` or `192.168.49.1`.
  4. Continue with "RUNNING IT AT A MEETING" below.


OPTION B: HOST FROM A LAPTOP (Mac, Windows, or Linux)
-------------------------------------------------------
One-time setup:
  1. Install Node.js if it isn't already on the laptop: https://nodejs.org
     (any recent version works — LTS is fine). Skip this if `node -v` in a
     terminal already prints a version.
  2. Get this project onto the laptop (download the zip from GitHub, or
     `git clone` it) and note the path to the `hosted-mode` folder.
  3. Open a terminal (Terminal.app on Mac, PowerShell/Command Prompt on
     Windows), `cd` into `hosted-mode`, and test it:
         node server.js
     You should see "TM Club Vote — hosted mode ... Server listening on
     port 3000". Ctrl+C to stop the test.

At the meeting, you need a local Wi-Fi network the laptop and voters'
phones can all join. Use whichever is easiest:
  - **A venue Wi-Fi router**, even one with no internet — as long as
    devices on it can reach each other (some venues enable "client/AP
    isolation" which blocks this; if voters can't load the page, that's
    the likely cause — switch to a hotspot instead).
  - **Someone's phone hotspot** — the laptop joins it like any other
    device, exactly the same as voters do.
  - **The laptop's own hotspot** — on a Mac: System Settings > General >
    Sharing > Internet Sharing, share "from" any interface (it still
    works to create a local network even with no real internet upstream)
    and share "to" Wi-Fi, then turn it on. On Windows: Settings > Network
    & internet > Mobile hotspot.

Then:
  1. In the terminal, `cd` to `hosted-mode`, run `node server.js`. Leave
     the terminal window open.
  2. **First run only:** the OS firewall may ask whether to allow incoming
     connections for Node — click **Allow**, otherwise phones won't be
     able to reach it.
  3. Find the laptop's local IP address on the network you're using:
       - Mac: `ipconfig getifaddr en0` in Terminal (or Wi-Fi icon in the
         menu bar > network name > Details).
       - Windows: `ipconfig` in Command Prompt, look for "IPv4 Address".
     It'll look like `192.168.1.42` or similar.
  4. Continue with "RUNNING IT AT A MEETING" below.


RUNNING IT AT A MEETING (both options)
-----------------------------------------
  1. Tell voters: "Join Wi-Fi network **[network name]**, then open
         http://<host-device-ip>:3000
     in your browser" — using the actual IP from Option A or B above
     (write it on a whiteboard or share verbally).
  2. On the organizer's own phone/browser, open the same address, tap the
     gear icon, and set up categories + nominees + an organizer passcode —
     same as the original app's Setup screen. Everyone's page updates
     automatically once nominees are added (no need to have people refresh,
     but if someone loaded the page before setup was done, a pull-to-refresh
     or reopening the page will pick up the categories).
     Typing IP addresses is a pain, so Setup also has a **"Show QR code to
     join"** button — it turns the exact address you're on into a QR code
     (generated entirely offline, no network call), so voters can just scan
     it with their phone's camera instead of typing anything. Only works if
     you reached Setup via the device's real network IP, not "localhost" —
     the button will warn you if that's the case.
  3. Voters vote from their own phones and submit. The organizer can watch
     the ballot count tick up live from the Setup or Results screen.
  4. When ready, the organizer opens Results (passcode-protected), reveals
     winners, and shares/downloads exactly like the original app.

To stop for the night: Ctrl+C in the terminal (Termux or laptop). Ballots
are saved to disk in `hosted-mode/data/state.json` after every change, so
nothing is lost even if the host device sleeps or the terminal gets
killed — just restart `node server.js` again and it picks up where it
left off.

To start a fresh meeting later, use "Clear ballots & start a new meeting"
in Setup, or simply delete `hosted-mode/data/state.json` before starting
the server (this resets everything, including categories).


UPDATING THE PORT
------------------
Default port is 3000. If something else on the host device is already
using it:
    PORT=8080 node server.js
and tell voters to use `:8080` instead.


THINGS TO KNOW
---------------
  - This mode has no PWA install / offline-cache step — the browser just
    talks live to the host device over the local network the whole time.
    If a voter walks out of range mid-vote, their submit will fail and
    they'll get a "check your connection" message — no data is lost, they
    just need to get back in range and try again.
  - The organizer passcode is checked by the server on every request now
    (not just hidden in the app), so it actually keeps other voters out of
    Setup/Results, not just out of the UI.
  - There's no login system, so enforcement is **one ballot per device**, not
    truly one per person: each phone gets a random token on first visit
    (stored in that browser only) and the server rejects a second vote from
    the same token, with an "You've already voted" screen in its place. This
    stops accidental double-taps and casual re-votes from the same phone, but
    a determined person could still clear their browser's site data or use a
    second device — this tool assumes a room of trusted club members, not an
    adversarial election.
  - A voter can tap "Undo my ballot" — right after submitting, or later from
    the "You've already voted" screen — to retract their own ballot and vote
    again. That only works for the ballot tied to their own device, not
    anyone else's.
