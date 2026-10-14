import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSearch, filterModules } from '../src/modules/foundation/launcher/exploreFilters.ts';
import { localizedModules } from '../src/modules/foundation/launcher/moduleLabels.ts';
import { searchDestinations } from '../src/modules/foundation/launcher/commandSearch.ts';

const modules = [
 {key:'rooms',label:'Rooms',summary:'Rooms near you',category:'living',defaultRank:1},
 {key:'jobs',label:'Jobs',summary:'Community jobs',category:'career',defaultRank:2},
];
const queries = ['గదులు','அறைகள்','ಕೊಠಡಿಗಳು','മുറികൾ','कमरे'];

test('native-script room queries find rooms rather than matching every module', () => {
 for (const query of queries) {
  assert.ok(normalizeSearch(query).length > 0);
  assert.deepEqual(filterModules(localizedModules(modules,'en'),query,'all').map(m=>m.key),['rooms']);
 }
});

test('localized directory supports both English and native labels without changing routes or ownership', () => {
 const translated=localizedModules(modules,'ta');
 assert.equal(translated[0].label,'அறைகள்');
 assert.deepEqual(filterModules(translated,'rooms','all').map(m=>m.key),['rooms']);
 assert.deepEqual(filterModules(translated,'வேலைகள்','all').map(m=>m.key),['jobs']);
 assert.deepEqual(filterModules(translated,'தமிழ்','all'),[]);
});

test('launcher preserves Indic vowel signs and supports module aliases', () => {
 const destinations=[{id:'rooms.home',title:'Browse rooms',module:'rooms',route:'/rooms'}, {id:'jobs.home',title:'Browse jobs',module:'jobs',route:'/jobs'}];
 for(const query of queries)assert.deepEqual(searchDestinations(destinations,query).map(d=>d.route),['/rooms']);
 assert.notEqual(normalizeSearch('कि'), normalizeSearch('क'));
});
