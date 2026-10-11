// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Oracle-only stand-in for the MIDP image: the original's four resource files
// are not needed (and are not redistributed), so loading one yields an empty image.
package javax.microedition.lcdui;

import java.io.IOException;

public class Image
{
    public static Image createImage(String name) throws IOException
    {
        return new Image();
    }
}
