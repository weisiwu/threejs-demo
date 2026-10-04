import assert from 'node:assert/strict';
import catalog from '../src/catalog.json';
import {mechanicsIds} from '../src/scenes/mechanics';
import {scienceIds} from '../src/scenes/science';
import {spaceIds} from '../src/scenes/spaces';
import {interfaceIds} from '../src/scenes/interfaces';
const ids=[...mechanicsIds,...scienceIds,...spaceIds,...interfaceIds];
assert.equal(catalog.length,43);assert.equal(new Set(ids).size,43);assert.deepEqual([...ids].sort(),catalog.map(d=>d.slug).sort());
for(const d of catalog){assert.match(d.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(!/dilum|sanjaya/i.test(d.slug+d.title));assert.ok(d.research.length>=3&&d.sources.length>=1);assert.ok(d.parameter.value>=d.parameter.min&&d.parameter.value<=d.parameter.max);}
assert.equal(catalog.filter(d=>d.article).length,30);
console.log('43 场景注册完整；30 篇当前文章关联；13 个补充实验没有链接到已删除文章。');
