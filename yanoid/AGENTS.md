# Repository rules

- Treat Yanoid 0.3.0 as the authoritative Contest-mode behavior.
- Do not silently import 0.3.5 features into Contest mode.
- Keep the browser game framework-free and fully client-side.
- Prefer explicit JavaScript functions over dynamic evaluation of translated Python.
- Any intentional deviation from 0.3.0 must be documented in `specs/PARITY.md` before implementation.
- Do not add historical audio/fonts/code whose licensing is not sufficiently precise for this GPLv3 port.
- Do not commit full upstream tarballs or extracted Yanoid trees to the public repository; keep `/reference` manifest-only.
- Add or update tests for changes to physics, collision response, power-up selection, stage progression or release-hygiene rules.
