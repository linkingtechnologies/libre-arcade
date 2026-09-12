# MinimalKlondike provenance

- Upstream: https://github.com/ShootMe/MinimalKlondike
- Frozen commit: `8983a1375aa15c5ca7f8c3df054aef37218f85c8`
- Retrieved: 2026-08-29
- Language: C# / .NET
- License: MIT (`LICENSE` retained verbatim)
- Role in KlondikeLab: offline solvability oracle and source of certified deals.

The upstream source is preserved without semantic changes. KlondikeLab ports
the solver architecture to readable JavaScript and runs it in a temporary Web
Worker. Deals exported from upstream tests retain the test name, draw count and
expected result.

## Italiano

Il sorgente originale è conservato senza modifiche semantiche. KlondikeLab ha convertito l’architettura del solver in JavaScript leggibile e la esegue in un Web Worker temporaneo. Le partite estratte dai test originali conservano nome del test, modalità di pesca e risultato atteso.
