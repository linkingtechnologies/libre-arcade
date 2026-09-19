import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { GameController } from '../public/src/core/controller.js';
import { serializeSave, deserializeSave } from '../public/src/core/save.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));

function sensibleHumanAction(controller, decision) {
  const human = controller.game.playerById(decision.playerId ?? controller.humanTurn?.playerId);
  if (decision.type === 'ROLL_DICE') return { type: 'ROLL_DICE' };
  if (decision.type === 'DETENTION_ACTION') {
    return human && human.cash > 350 ? { type: 'PAY_DETENTION' } : { type: 'ROLL_DICE' };
  }
  if (decision.type === 'BUY_PROPERTY') {
    const price = controller.game.board.spaces[decision.index].price;
    return human && human.cash - price >= 220 ? { type: 'BUY' } : { type: 'AUCTION' };
  }
  if (decision.type === 'AUCTION_BIDS') {
    const bids = {};
    for (const bidder of decision.humanBidders ?? []) {
      const price = controller.game.board.spaces[decision.index].price ?? 0;
      bids[bidder.playerId] = Math.min(bidder.maxBid, Math.floor(price * 0.75));
    }
    return { type: 'RESOLVE_AUCTION', bids };
  }
  if (decision.type === 'TURN_ACTIONS') {
    const develop = decision.actions?.develop ?? [];
    if (develop.length && human && human.cash - develop[0].cost >= 180) return { type: 'BUILD_EMBELLISHMENT', index: develop[0].index };
    const redeem = decision.actions?.redeem ?? [];
    if (redeem.length && human && human.cash - redeem[0].cost >= 220) return { type: 'REDEEM_PROPERTY', index: redeem[0].index };
    return { type: 'END_TURN' };
  }
  if (decision.type === 'TRADE_OFFER') return { type: 'DECLINE_TRADE' };
  if (decision.type === 'TURN_REVIEW') return { type: 'ACK_TURN' };
  throw new Error(`Unhandled QA decision: ${decision.type}`);
}

function assertSaneState(state) {
  assert.ok(state.turnNumber >= 0);
  assert.ok(state.roundNumber >= 0);
  assert.equal(state.players.length >= 2, true);
  for (const player of state.players) {
    assert.equal(Number.isFinite(player.cash), true, `${player.name}: cash`);
    assert.equal(Number.isFinite(player.netWorth), true, `${player.name}: netWorth`);
    assert.ok(player.position >= 0 && player.position < board.spaces.length, `${player.name}: position`);
  }
  assert.equal(state.spaces.length, board.spaces.length);
}

test('QA: mixed human/CPU games survive repeated save/reload cycles', () => {
  for (let seed = 101; seed <= 120; seed += 1) {
    let controller = GameController.create({
      board,
      participants: [
        { type: 'human', name: 'Grugnetto' },
        { type: 'cpu', profile: 'Zilla' },
        { type: 'cpu', profile: 'Queen' },
        { type: 'cpu', profile: 'Hans' }
      ],
      seed,
      maxTurns: 3000
    });
    let packet = controller.advance();
    let decisions = 0;
    while (packet.status !== 'complete' && decisions < 12000) {
      assertSaneState(packet.state);
      if (decisions > 0 && decisions % 11 === 0) {
        const json = serializeSave(controller);
        const restored = deserializeSave({ board, json });
        assert.deepEqual(restored.getPublicState(), controller.getPublicState(), `seed ${seed}, decision ${decisions}`);
        controller = restored;
        packet = { status: controller.status, pendingDecision: controller.pendingDecision, state: controller.getPublicState(), events: [] };
      }
      if (!packet.pendingDecision) packet = controller.advance();
      else packet = controller.dispatch(sensibleHumanAction(controller, packet.pendingDecision));
      decisions += 1;
    }
    assert.equal(packet.status, 'complete', `seed ${seed} did not finish`);
    assertSaneState(packet.state);
  }
});

test('QA: corrupted, truncated and incompatible saves fail safely', () => {
  const c = GameController.create({ board, participants: [{ type: 'human', name: 'G' }, { type: 'cpu', profile: 'Zilla' }], seed: 77 });
  c.advance();
  const good = serializeSave(c);
  assert.throws(() => deserializeSave({ board, json: '{' }), SyntaxError);
  assert.throws(() => deserializeSave({ board, json: '{}' }), /Unsupported save format/);
  const wrongVersion = JSON.parse(good); wrongVersion.version = 999;
  assert.throws(() => deserializeSave({ board, json: wrongVersion }), /Unsupported save format/);
  const wrongBoard = JSON.parse(good); wrongBoard.controller.game.boardContentVersion = '999.0.0';
  assert.throws(() => deserializeSave({ board, json: wrongBoard }), /board\/version mismatch/);
  assert.doesNotThrow(() => deserializeSave({ board, json: good }));
});

test('QA: save/restore preserves Base Camp decisions', () => {
  const c = GameController.create({ board, participants: [{ type: 'human', name: 'G' }, { type: 'cpu', profile: 'Queen' }], seed: 8 });
  const human = c.game.players.find(p => p.type === 'human');
  human.detained = 1;
  // Force the human to be the next active participant without changing game semantics.
  c.currentIndex = (c.game.players.indexOf(human) - 1 + c.game.players.length) % c.game.players.length;
  let p = c.advance();
  // If a CPU was consumed first due to ordering, keep advancing until the human decision appears.
  for (let i = 0; i < 4 && p.pendingDecision?.type !== 'DETENTION_ACTION'; i += 1) p = c.advance();
  assert.equal(p.pendingDecision?.type, 'DETENTION_ACTION');
  const restored = deserializeSave({ board, json: serializeSave(c) });
  assert.deepEqual(restored.pendingDecision, c.pendingDecision);
  assert.equal(restored.game.playerById(human.id).detained, 1);
});

test('QA: all project JavaScript parses before release', () => {
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
    }
  };
  walk(path.join(root, 'public', 'src'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${path.relative(root, file)}\n${result.stderr}`);
  }
});

test('QA: public archaeology package externalizes audited upstream archives but preserves reproducible provenance', () => {
  const forbidden = [
    path.join(root, 'reference', 'KludgopolB.zip'),
    path.join(root, 'reference', 'KludgopolB_src.zip'),
    path.join(root, 'reference', 'jatlantik-r36', 'jatlantik-code-r36-trunk.zip')
  ];
  for (const file of forbidden) assert.equal(fs.existsSync(file), false, `${path.basename(file)} must not be redistributed`);

  const external = fs.readFileSync(path.join(root, 'reference', 'EXTERNAL_ARTIFACTS.md'), 'utf8');
  assert.match(external, /b72f129a7543780ec54d56b2b42fb176564863afc9999748cc78419ef79fd4a1/);
  assert.match(external, /5951cf49b010dbcf6be4a7f30d6936c12ba8c374ed546d4b1b0e42b4a1c240dc/);
  assert.match(external, /1850680fc548d3b6621331fdec7677ecd3bbbd75aa7211d42de62d93d8000dfd/);
  assert.match(external, /sourceforge\.net\/projects\/kludgopolb\/files\//);
  assert.match(external, /sourceforge\.net\/projects\/jatlantik\//);
});

test('QA: public reference tree contains no bundled archive blobs', () => {
  const forbiddenExt = /\.(?:zip|jar|rar|7z|tar|tgz|gz|bz2|xz)$/i;
  const hits = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && forbiddenExt.test(entry.name)) hits.push(path.relative(root, full));
    }
  };
  walk(path.join(root, 'reference'));
  assert.deepEqual(hits, []);
});

test('QA: public HTML references packaged local files only', () => {
  const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(ref => !ref.startsWith('#'));
  for (const ref of refs) {
    assert.doesNotMatch(ref, /^https?:\/\//, `external production dependency: ${ref}`);
    assert.equal(fs.existsSync(path.join(root, 'public', ref)), true, `missing packaged reference: ${ref}`);
  }
});

test('QA: public documentation and current config use project-native wording', () => {
  const targets = [path.join(root, 'README.md'), path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json')];
  for (const file of targets) {
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /Grugnetto|grugnetto/i, `missing project-native wording: ${path.relative(root, file)}`);
  }
});


test('QA: release documentation records RC33 metadata-only redactions accurately', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /metadata\/footer-only wording redactions/i);
  assert.doesNotMatch(readme, /v1\.3 is untouched/i);
  const checklist = fs.readFileSync(path.join(root, 'specs', 'release-checklist.md'), 'utf8');
  assert.match(checklist, /Manual release gates/);
});


test('QA: local server declares image and runtime MIME types explicitly', () => {
  const server = fs.readFileSync(path.join(root, 'scripts', 'serve.mjs'), 'utf8');
  assert.match(server, /\['\.svg', 'image\/svg\+xml; charset=utf-8'\]/);
  assert.match(server, /\['\.webp', 'image\/webp'\]/);
  assert.equal(fs.existsSync(path.join(root, 'scripts', 'http-smoke.mjs')), true);
});


test('QA: every shipped SHA-256 manifest verifies', () => {
  const manifests = [
    'reference/SHA256SUMS',
    'public/boards/grugnetto-32-v1.4/SHA256SUMS',
    'public/boards/layouts/grugnetto-islands/SHA256SUMS'
  ];
  for (const manifest of manifests) {
    const absolute = path.join(root, manifest);
    const result = spawnSync('sha256sum', ['-c', path.basename(absolute)], {
      cwd: path.dirname(absolute), encoding: 'utf8'
    });
    assert.equal(result.status, 0, `${manifest}\n${result.stdout}\n${result.stderr}`);
  }
});
