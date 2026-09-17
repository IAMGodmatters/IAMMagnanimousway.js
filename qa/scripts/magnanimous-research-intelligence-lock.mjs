import assert from 'node:assert/strict';
import {researchIntent,rankResearchSources,buildResearchQueries,evidenceInstructions,researchQuality} from '../../worker/src/magnanimous-research-intelligence.js';

const current=researchIntent('What is the current price and latest status?');
assert.equal(current.needsResearch,true);assert.equal(current.current,true);assert.equal(current.preferPrimary,true);
const deep=researchIntent('Do an in-depth audit and verify this with sources');assert.equal(deep.depth,'deep');
const health=researchIntent('Is this medicine safe?');assert.equal(health.highStakes,true);assert.equal(health.needsResearch,true);
const ranked=rankResearchSources([
 {title:'Blog',url:'https://example.com/post',description:'x',source:'web'},
 {title:'Official rule',url:'https://agency.gov/rule',description:'y',source:'web'},
 {title:'Duplicate',url:'https://agency.gov/rule',description:'z',source:'web'}
],{preferPrimary:true,query:'rule'});
assert.equal(ranked.length,2);assert.equal(ranked[0].source_class,'government');
const queries=buildResearchQueries('telecom regulation',{preferPrimary:true,highStakes:true,current:true,depth:'deep'});assert.ok(queries.length>=3);assert.ok(queries.some(x=>x.includes('official primary source')));
const instructions=evidenceInstructions({depth:'deep'},ranked);assert.match(instructions,/Never cite a source that does not support/);assert.match(instructions,/conflict/);assert.match(instructions,/unknown/);
const quality=researchQuality(ranked,{preferPrimary:true});assert.equal(quality.has_primary,true);assert.equal(quality.cross_checked,true);
console.log('Magnanimous research intelligence lock passed');
