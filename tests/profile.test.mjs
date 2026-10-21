import assert from 'node:assert/strict';
import { profileDisplayName } from '../js/profile.js';

assert.equal(profileDisplayName({ name: 'Francisco Alegría', nickname: 'PanchoMAT' }), 'Francisco Alegría');
assert.equal(profileDisplayName({ name: '   ', nickname: 'PanchoMAT' }), 'PanchoMAT');
assert.equal(profileDisplayName({ name: '', nickname: '' }), 'Jugador');
assert.equal(profileDisplayName({}), 'Jugador');
assert.equal(profileDisplayName({ name: '  Ana  ' }), 'Ana');

console.log('profile.test.mjs: OK');
