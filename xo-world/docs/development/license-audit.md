# XO World — License Audit

## Historical code

`xoworld.java` carries an explicit GNU GPL notice allowing GPL version 2 or any
later version. This permits redistribution of a derivative restoration under
GPL version 3.

Status: **GREEN** for the historical code used by the restoration.

## Historical raster assets

The original release contains raster images used by the Java applet, but their
individual authorship/provenance has not been independently established to the
same standard as the Java source header.

Status: **YELLOW**.

Mitigation: the browser build redistributes none of those raster assets. The
visual presentation is generated procedurally with Canvas/CSS.

## Restoration

The HTML5/JavaScript restoration is distributed under GNU GPL version 3.
