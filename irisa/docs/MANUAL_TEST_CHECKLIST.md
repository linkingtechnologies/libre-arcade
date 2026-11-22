# Manual test checklist

Run `npm run dev`, open http://localhost:8080/. Tick each box per browser
(Chrome, Firefox, a phone browser). The automated session covers Chrome only.

## Start
- [ ] Title shows, no sound plays, no .mp3 is requested (network tab) before Play.
- [ ] Italian browser shows Italian; any other shows English; the EN/IT button switches and it is remembered after reload.
- [ ] Play starts level 1.

## Controls
- [ ] Arrow keys and W A S D move one square; holding a key does not repeat.
- [ ] R restarts the level, also right after a move and while enemies are frozen.
- [ ] Touch: the arrow pad moves one square per tap; swipes on the board move; a tiny drag does nothing.
- [ ] The page never scrolls or zooms while playing (touch and wheel).

## Rules (compare with the original at matthewminer.com/irisa if reachable)
- [ ] Enemies step one square toward you, diagonally too, after each move.
- [ ] Touching an enemy greys and blurs the board, plays the lose sound, restarts the level after 2 s.
- [ ] Reaching the pentagon blurs the board, plays the win sound, loads the next level after 2 s.
- [ ] Enemy into a wall disappears; two enemies meeting leave a wall.
- [ ] Teleporters pair up. Freeze clock stops enemies for its number of moves. Reverse swaps enemies and walls.
- [ ] Level dots: only reached levels are clickable.
- [ ] Beating level 20 shows the finish screen; Play again starts level 1.

## Pause and sound
- [ ] Pause button, P and Esc pause; the win/lose 2 s timer does not run while paused; Resume continues.
- [ ] Switching to another tab pauses.
- [ ] Sound button and M mute and unmute; the choice survives a reload.

## Layout
- [ ] Phone portrait and landscape, tablet, desktop: board square, nothing overlaps, pad beside or below the board.
- [ ] Rotate while playing: the game continues.
- [ ] Resize the desktop window: the board rescales without distortion.
