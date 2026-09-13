// SPDX-License-Identifier: GPL-3.0-or-later
/** Tiny dependency-free XML reader for Bubble Train's data schema.
 * It intentionally supports only elements/attributes/comments/declarations;
 * the historical level files do not require namespaces or mixed content. */
export function parseXmlLite(xml) {
  const source = String(xml).replace(/\r\n?/g, '\n');
  const root = { name: '#document', attrs: {}, children: [] };
  const stack = [root];
  const tokens = source.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<[^>]+>|[^<]+/g) ?? [];

  for (const token of tokens) {
    if (!token.startsWith('<')) continue;
    if (token.startsWith('<!--') || token.startsWith('<?') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const name = token.slice(2, -1).trim();
      if (stack.length <= 1 || stack.at(-1).name !== name) throw new Error(`Malformed XML: closing ${name}`);
      stack.pop(); continue;
    }
    const selfClosing = /\/\s*>$/.test(token);
    const body = token.slice(1, selfClosing ? token.lastIndexOf('/') : -1).trim();
    const m = body.match(/^([^\s/>]+)/);
    if (!m) continue;
    const node = { name: m[1], attrs: {}, children: [] };
    const attrs = body.slice(m[0].length);
    const attrRe = /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = attrRe.exec(attrs))) node.attrs[a[1]] = decodeEntities(a[2] ?? a[3] ?? '');
    stack.at(-1).children.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`Malformed XML: unclosed ${stack.at(-1).name}`);
  if (root.children.length !== 1) throw new Error('Expected exactly one root element');
  return root.children[0];
}

function decodeEntities(s) {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
export function child(node, name) { return node.children.find(c => c.name === name) ?? null; }
export function children(node, name) { return node.children.filter(c => c.name === name); }
