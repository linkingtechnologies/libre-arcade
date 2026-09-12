# Historical AI porting protocol

For each historical AI:

1. Preserve the exact source artifact in `/reference`.
2. Record version, release date, author, license, source URL and checksum.
3. Identify the minimal source files that determine shot selection and state transitions.
4. Write a behaviour map before translating code.
5. Replace platform calls (GLib/libc RNG, sockets, GUI) with injected adapters, not algorithm changes.
6. Build deterministic fixtures around known internal states.
7. Compare C/original traces with JavaScript traces where the original can still run.
8. Label discovered original bugs and preserve them in `faithful`; fixes go to a separate player.
