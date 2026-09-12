# Playable UI 0.5

BattleLab 0.5 adds a complete Italian/English player-facing interface while keeping the framework-free single-player Battleship flow and the historical player modules unchanged.

## Flow

1. Select an opponent using game-first difficulty descriptions.
2. Place the classic `5,4,3,3,2` fleet manually or randomly.
3. Alternate one human shot and one computer shot until a fleet is sunk.
4. `Replay / Rigioca` keeps the player's fleet layout and opponent but creates a new enemy board and seed.
5. `New game / Nuova partita` returns to fleet placement.

## Language

- Italian and English are available from the header at all times.
- The selected language is stored locally in the browser.
- Menus, opponent descriptions, placement, battle status, toasts, results, instructions, accessibility labels and the history panel are translated.
- Player-facing descriptions avoid implementation jargon; provenance and engineering details remain in the repository documentation.

## Opponents

The visible names are intentionally simple: Beginner/Principiante, Scout/Esploratore, Strategist/Stratega, Admiral/Ammiraglio and 2009 Classic/Classico 2009.

Under the UI these still map unchanged to Warboats 0.51 L1-L4 and the Bataille Navale OS4 2009 reconstruction.

The UI never changes an AI's normal decision logic. The only playability exception is the known Warboats historical targeting stall: the Arena records it as a stall, while the interactive game catches it and makes one deterministic random recovery shot so the browser session cannot hang.

## Responsive design

The browser body is fixed to the viewport. Any overflow is contained inside the application stage instead of creating a page-level vertical scrollbar. On narrow screens the two combat boards remain side-by-side and labels/controls compact automatically.
