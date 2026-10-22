import assert from 'node:assert/strict';
import {
  profileDisplayName,
  profileGreetingName,
  profileHasIdentity,
} from '../js/profile.js';

assert.equal(profileDisplayName({ name: 'Francisco Alegría', nickname: 'Pancho' }), 'Francisco Alegría');
assert.equal(profileDisplayName({ name: '   ', nickname: 'Pancho' }), 'Pancho');
assert.equal(profileDisplayName({ name: '', nickname: '' }), 'Jugador');
assert.equal(profileDisplayName({}), 'Jugador');
assert.equal(profileDisplayName({ name: '  Ana  ' }), 'Ana');

assert.equal(profileGreetingName({ name: 'Francisco Alegría', nickname: 'Pancho' }), 'Pancho');
assert.equal(profileGreetingName({ name: 'Francisco Alegría', nickname: '' }), 'Francisco');
assert.equal(profileGreetingName({ name: '', nickname: '' }), 'Jugador');
assert.equal(profileGreetingName({ name: 'Ana María', nickname: 'Anita' }), 'Anita');

assert.equal(profileHasIdentity({ name: 'Francisco', nickname: '' }), true);
assert.equal(profileHasIdentity({ name: '', nickname: 'Pancho' }), true);
assert.equal(profileHasIdentity({ name: '   ', nickname: '   ' }), false);
assert.equal(profileHasIdentity({}), false);

console.log('profile.test.mjs: OK');
