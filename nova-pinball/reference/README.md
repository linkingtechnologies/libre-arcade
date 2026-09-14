# Historical reference material

This directory is intentionally **document-only** in the public GitHub release.

The original Nova Pinball archives are archaeological source material, but they also contain third-party or insufficiently documented media. For that reason this repository does not republish the original `.love`, Windows archive, executable, tracker modules, WAVs or font binaries.

Use `MANIFEST.md` to download the official upstream artifacts and verify them locally. Keep those downloaded files unchanged in a private/local preservation folder if you want a full archaeological mirror.

On Windows PowerShell, verify an artifact with:

```powershell
Get-FileHash .\nova-pinball-0.2.3.love -Algorithm SHA256
```

On macOS/Linux:

```sh
sha256sum nova-pinball-0.2.3.love
```

A matching hash establishes that your local copy is the exact artifact audited by this restoration.

Historical author/contributor/third-party attribution and engine repository lineage are recorded in `../docs/UPSTREAM_CREDITS.md`.
