# Original JAR — acquisition and public-repository boundary

The unmodified original JAR is **not included in the public-first-commit package**. Retain any already-downloaded original in a separate, private archive and do not commit it (including Git LFS or releases) without resolving its bundled-resource rights.

- File: `comet-pinball-1.1.0-b480.jar`
- Historical upstream: https://sourceforge.net/projects/comet-pinball/files/1.1.0/
- SHA-256: `84aa5e48c962439113d7e444881e3891c5a179b2306d49db42da9740d580a05f`
- Size: 7,816,773 bytes

After downloading a personal evaluation copy **from upstream**, verify it:

```sh
sha256sum comet-pinball-1.1.0-b480.jar
```

The recorded hash must match exactly. For optional historic Java oracle scripts, put the verified JAR at `reference/releases/comet-pinball-1.1.0-b480.jar` **locally only**; this path is gitignored. Current checked-in trace data and the JavaScript regression tests do not require publishing the JAR. The SHA entry in `reference/SHA256SUMS` remains as an archival *identity record*, not as an assertion that the binary is bundled.

See `../../JAR-LICENSE-REVIEW.md` for the dependency and bundled-asset audit.
