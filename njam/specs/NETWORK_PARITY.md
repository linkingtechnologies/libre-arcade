# Njam 1.21 network-duel preservation notes

Source reference: `reference/njam-1.21-os4/Source/njamnet.cpp` plus the network branches in `njamgame.cpp`.

## Original transport

Njam 1.21 uses **SDL_net TCP**, listening/connecting on port **5547**. A normal browser cannot create or accept arbitrary raw TCP sockets, so transport must be adapted while retaining the game protocol and authority model.

## Session/player allocation

The host side owns player slots P0/P1; the joining side owns P2/P3. Each side may enable one or two local players. Connection setup exchanges a four-byte identification/player-presence message beginning with `N`, `J`, followed by local playing flags.

## Map authority

The host chooses the duel map. It sends the current **672-byte (28×24) runtime map** to the client. The joining side acknowledges map receipt with `A`. Host authority over map selection and ghosts should remain intact in a browser transport adapter.

## Per-frame packet shape

Host → client uses **56 bytes** (`16 + 8*5`):

- bytes 0–1: `N` plus message/escape flag;
- bytes 2–15: two host-player records, seven bytes each (`rotate, x, y, xo, yo, 2+vx, 2+vy`);
- bytes 16–55: eight ghost records, five bytes each (`x, y, xo, yo, delay`).

Client → host uses **16 bytes**, carrying the corresponding two client-player records plus header. In the original implementation the join client does not advance ghosts locally; host ghost state is authoritative.

An escape/end-round flag is propagated so both peers leave the round coherently.

## Preserved in this build

`src/network-protocol.js` already implements and tests the transport-independent 1.21 wire semantics: 4-byte CID, 672-byte x-major runtime-map packet, 56-byte host frame, 16-byte client reply, signed velocity offset encoding, eight host-authoritative ghost records and the exit flag. No network UI or peer transport is enabled yet.

## Browser adaptation target

Preferred preservation architecture:

1. keep the 1.21 packet serializer/deserializer and byte-level field semantics in JavaScript;
2. keep host map selection, ghost authority, player-slot ownership and duel scoring unchanged;
3. replace only SDL_net TCP transport with a reliable ordered **WebRTC DataChannel**;
4. use manual offer/answer copy-paste or a tiny signaling service so no gameplay server is required;
5. optionally provide a WebSocket-to-TCP relay for interoperability testing with a historical/native Njam build.

A WebRTC implementation can preserve gameplay/network semantics closely, but it should be labelled a **transport adaptation**, not claimed as byte-for-byte SDL_net parity.
