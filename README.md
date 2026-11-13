# Shorts Scroll Counter

A small browser extension for Chrome and Brave. It puts a box on YouTube Shorts showing how many Shorts you've scrolled through.

- **Big number**: scrolls today (goes back to 0 at midnight)
- **session**: scrolls since you opened this tab
- **all-time**: every scroll since you installed it
- Drag the box anywhere. It remembers where you put it.
- `–` shrinks it to just the number. `↻` resets today's count.

## Install (Chrome or Brave)

1. Open `chrome://extensions` (in Brave: `brave://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder (`D:\App development\scroll counter`).
4. Open or refresh a YouTube tab and go to any Short.

If you edit the files, click the reload icon on the extension's card, then refresh the YouTube tab.

## How it counts

Each time the Short's ID in the address bar changes (`youtube.com/shorts/<id>`), that's one scroll. The first Short you open doesn't count, because you haven't scrolled yet. Scrolling back up to an earlier Short counts too, since it's still a scroll.
