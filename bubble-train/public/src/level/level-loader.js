// SPDX-License-Identifier: GPL-3.0-or-later
import { parseXmlLite, child, children } from './xml-lite.js';
import { LineSection } from '../geometry/line-section.js';
import { ArcSection } from '../geometry/arc-section.js';
import { SpiralSection } from '../geometry/spiral-section.js';
import { Track } from '../geometry/track.js';
import { isTruthy } from '../game/bullet-factory.js';

export function parsePoint(value) {
  const [x, y] = String(value).split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Invalid point: ${value}`);
  return { x, y };
}

export function loadLevelXml(xml) {
  const root = parseXmlLite(xml);
  if (root.name !== 'level') throw new Error('Expected <level> root');
  const cannonNodes = child(root, 'cannons') ? children(child(root, 'cannons'), 'cannon') : [];
  const trainNodes = child(root, 'trainstations') ? children(child(root, 'trainstations'), 'train') : [];
  return {
    cannons: cannonNodes.map(parseCannon),
    trains: trainNodes.map(parseTrain)
  };
}

export function loadGameManifestXml(xml) {
  const root = parseXmlLite(xml);
  if (root.name !== 'game') throw new Error('Expected <game> root');
  return children(root, 'level').map(n => ({ theme: n.attrs.theme ?? null, src: n.attrs.src }));
}

function parseCannon(n) {
  const bullets = child(n, 'bullets');
  return {
    type: n.attrs.type ?? 'rotation',
    position: parsePoint(n.attrs.pos),
    reloadMs: Number(n.attrs.bulletreloadtime ?? 500),
    bulletSpeed: Number(n.attrs.bulletspeed ?? 8),
    bullets: bullets ? parsePopulation(bullets, 'bullet') : { random: true, colourCount: 3, count: Infinity, explicit: [] }
  };
}

function parseTrain(n) {
  const trackNode = child(n, 'track');
  const carriages = child(n, 'carriages');
  if (!trackNode || !carriages) throw new Error('<train> requires <track> and <carriages>');

  const sections = [];
  let previousEnd = null;
  for (const node of trackNode.children) {
    const section = parseSection(node, previousEnd);
    sections.push(section);
    previousEnd = parsePoint(node.attrs.endpos);
  }

  return {
    speed: Number(n.attrs.speed ?? 2),
    trackColour: trackNode.attrs.colour ?? null,
    track: new Track(sections),
    carriages: parsePopulation(carriages, 'carriage')
  };
}

function parsePopulation(n, childName) {
  const explicit = children(n, childName).map(x => ({ ...x.attrs, number: Number(x.attrs.number ?? 1) }));
  const requested = n.attrs['carriage-num'] ?? n.attrs['bullet-num'];
  let count;
  if (requested != null) count = Number(requested);
  else if (childName === 'carriage') {
    // Source fallback counts only explicitly listed normal carriages.
    count = explicit.filter(x => !isTruthy(x.special)).reduce((s, x) => s + x.number, 0);
  } else count = Infinity;

  return {
    random: n.attrs.random !== '0',
    colourCount: Number(n.attrs['colour-num'] ?? 3),
    count,
    explicit
  };
}

function parseSection(n, previousEnd) {
  const start = n.attrs.startpos != null ? parsePoint(n.attrs.startpos) : previousEnd;
  if (!start) throw new Error(`First <${n.name}> requires startpos`);
  const end = parsePoint(n.attrs.endpos);
  if (n.name === 'line') return new LineSection(start, end);
  if (n.name === 'arc') return new ArcSection(start, end, parsePoint(n.attrs.centre), n.attrs.rotation ?? 'clockwise');
  if (n.name === 'spiral') return new SpiralSection(start, end, parsePoint(n.attrs.centre), n.attrs.rotation ?? 'clockwise');
  throw new Error(`Unsupported track section: <${n.name}>`);
}
