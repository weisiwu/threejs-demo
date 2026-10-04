export type V3=[number,number,number];
export type P2={x:number;y:number};
export const TAU=Math.PI*2;
export const clamp=(x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const distance=(a:V3,b:V3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function seeded(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function circleIntersections(a:P2,r0:number,b:P2,r1:number):{ok:true;points:[P2,P2]}|{ok:false;reason:string}{
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
 if(![r0,r1,d].every(Number.isFinite)||r0<=0||r1<=0)return{ok:false,reason:'非法半径或坐标'};
 if(d<1e-9)return{ok:false,reason:'圆心重合'};
 if(d>r0+r1+1e-9||d<Math.abs(r0-r1)-1e-9)return{ok:false,reason:'两圆不相交'};
 const s=(r0*r0-r1*r1+d*d)/(2*d),h=Math.sqrt(Math.max(0,r0*r0-s*s));
 const x=a.x+dx*s/d,y=a.y+dy*s/d,rx=-dy*h/d,ry=dx*h/d;
 return{ok:true,points:[{x:x+rx,y:y+ry},{x:x-rx,y:y-ry}]};
}
export function planarIK(x:number,y:number,l1:number,l2:number,branch=1){
 const d=Math.hypot(x,y);
 if(![x,y,l1,l2].every(Number.isFinite)||l1<=0||l2<=0||d>l1+l2+1e-8||d<Math.abs(l1-l2)-1e-8)return{ok:false as const,reason:'目标不可达'};
 const elbow=branch*Math.acos(clamp((d*d-l1*l1-l2*l2)/(2*l1*l2),-1,1));
 const shoulder=Math.atan2(y,x)-Math.atan2(l2*Math.sin(elbow),l1+l2*Math.cos(elbow));
 const knee:P2={x:l1*Math.cos(shoulder),y:l1*Math.sin(shoulder)};
 const end:P2={x:knee.x+l2*Math.cos(shoulder+elbow),y:knee.y+l2*Math.sin(shoulder+elbow)};
 return{ok:true as const,shoulder,elbow,knee,end,error:Math.hypot(end.x-x,end.y-y)};
}
export const JANSEN_EDGES:[number,number,number][]=[[0,1,Math.hypot(38,7.8)],[0,2,15],[1,3,41.5],[2,3,50],[1,4,39.3],[2,4,61.9],[1,5,40.1],[3,5,55.8],[4,6,36.7],[5,6,39.4],[4,7,49],[6,7,65.7]];
export function jansen(theta:number,mirror=false){
 const p:P2[]=[{x:0,y:0},{x:-38,y:7.8},{x:15*Math.cos(theta),y:15*Math.sin(theta)}];
 const operations:[number,number,number,number,'x'|'y',number][]=[[1,2,41.5,50,'y',-1],[1,2,39.3,61.9,'y',1],[1,3,40.1,55.8,'x',-1],[4,5,36.7,39.4,'x',-1],[4,6,49,65.7,'y',1]];
 for(const[a,b,r0,r1,axis,direction]of operations){const result=circleIntersections(p[a],r0,p[b],r1);if(!result.ok)return{ok:false as const,reason:result.reason};p.push(result.points.sort((u,v)=>direction*(v[axis]-u[axis]))[0]);}
 const error=Math.max(...JANSEN_EDGES.map(([a,b,l])=>Math.abs(Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y)-l)));
 if(mirror)for(const q of p)q.x=-q.x;
 return{ok:true as const,points:p,error};
}
function atLength(origin:V3,point:V3,length:number):V3{const d=distance(origin,point)||1e-9;return origin.map((x,i)=>x+(point[i]-x)*length/d)as V3;}
export function fabrik(input:V3[],target:V3,length:number,iterations=16,tolerance=0.001){
 const points=input.map(p=>[...p]as V3),root=[...points[0]]as V3,total=(points.length-1)*length;
 if(distance(root,target)>=total){for(let i=1;i<points.length;i++)points[i]=atLength(points[i-1],target,length);return{points,error:distance(points.at(-1)!,target),reachable:false};}
 for(let step=0;step<iterations;step++){
  points[points.length-1]=[...target];
  for(let i=points.length-2;i>=0;i--)points[i]=atLength(points[i+1],points[i],length);
  points[0]=[...root];for(let i=1;i<points.length;i++)points[i]=atLength(points[i-1],points[i],length);
  if(distance(points.at(-1)!,target)<tolerance)break;
 }
 return{points,error:distance(points.at(-1)!,target),reachable:true};
}
export function crankSlider(theta:number,r:number,l:number){if(l<r||r<=0)throw Error('连杆长度须不小于曲柄半径');return r*Math.cos(theta)+Math.sqrt(l*l-r*r*Math.sin(theta)**2);}
export type Part={id:string;type:'resistor'|'voltage-source';pins:[string,string];value:number};
export type Circuit={nodes:string[];parts:Part[]};
export function parseCircuit(raw:string):Circuit{
 const c=JSON.parse(raw);if(!c||!Array.isArray(c.nodes)||!c.nodes.includes('0')||!Array.isArray(c.parts)||c.nodes.length>30||c.parts.length>60)throw Error('网表须有参考节点 0，最多 30 节点、60 器件');
 if(new Set(c.nodes).size!==c.nodes.length||c.nodes.some((n:unknown)=>typeof n!=='string'))throw Error('节点 ID 须是唯一字符串');
 const ids=new Set<string>();for(const p of c.parts){if(!p||typeof p.id!=='string'||ids.has(p.id))throw Error('器件 ID 重复或缺失');ids.add(p.id);if(!['resistor','voltage-source'].includes(p.type))throw Error('不支持器件类型 '+p.type);if(!Array.isArray(p.pins)||p.pins.length!==2||p.pins[0]===p.pins[1]||p.pins.some((n:string)=>!c.nodes.includes(n)))throw Error('器件引脚引用无效');if(!Number.isFinite(p.value)||(p.type==='resistor'&&p.value<=0))throw Error('器件参数无效');}
 return c;
}
export function solveCircuit(c:Circuit):Record<string,number>{
 const nodes=c.nodes.filter(n=>n!=='0'),vs=c.parts.filter(p=>p.type==='voltage-source'),n=nodes.length+vs.length;
 if(n===0)throw Error('网表没有待求解节点');
 const A=Array.from({length:n},()=>Array(n).fill(0)as number[]),b=Array(n).fill(0)as number[];
 const idx=(name:string)=>nodes.indexOf(name);
 for(const p of c.parts){const i=idx(p.pins[0]),j=idx(p.pins[1]);if(p.type==='resistor'){const g=1/p.value;if(i>=0)A[i][i]+=g;if(j>=0)A[j][j]+=g;if(i>=0&&j>=0){A[i][j]-=g;A[j][i]-=g;}}else{const v=nodes.length+vs.indexOf(p);if(i>=0){A[i][v]+=1;A[v][i]+=1;}if(j>=0){A[j][v]-=1;A[v][j]-=1;}b[v]=p.value;}}
 for(let col=0;col<n;col++){let pivot=col;for(let row=col+1;row<n;row++)if(Math.abs(A[row][col])>Math.abs(A[pivot][col]))pivot=row;if(Math.abs(A[pivot][col])<1e-12)throw Error('网表奇异：检查孤立节点或电压源约束');[A[col],A[pivot]]=[A[pivot],A[col]];[b[col],b[pivot]]=[b[pivot],b[col]];const scale=A[col][col];for(let k=col;k<n;k++)A[col][k]/=scale;b[col]/=scale;for(let row=0;row<n;row++){if(row===col)continue;const f=A[row][col];for(let k=col;k<n;k++)A[row][k]-=f*A[col][k];b[row]-=f*b[col];}}
 return Object.fromEntries([['0',0],...nodes.map((node,i)=>[node,b[i]])]);
}
export function astar(width:number,height:number,blocked:Set<string>,start:[number,number],goal:[number,number]){
 const key=(p:[number,number])=>p.join(',');const inside=([x,y]:[number,number])=>x>=0&&y>=0&&x<width&&y<height;
 if(!inside(start)||!inside(goal)||blocked.has(key(start))||blocked.has(key(goal)))return null;
 const open=[start],g=new Map([[key(start),0]]),previous=new Map<string,string>(),visited=new Set<string>();
 const h=([x,y]:[number,number])=>Math.abs(x-goal[0])+Math.abs(y-goal[1]);
 while(open.length){open.sort((a,b)=>g.get(key(a))!+h(a)-g.get(key(b))!-h(b));const current=open.shift()!,k=key(current);if(k===key(goal)){const path:[number,number][]=[goal];let p=k;while(previous.has(p)){p=previous.get(p)!;path.push(p.split(',').map(Number)as[number,number]);}return path.reverse();}if(visited.has(k))continue;visited.add(k);
  for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const next:[number,number]=[current[0]+dx,current[1]+dy],nk=key(next);if(!inside(next)||blocked.has(nk)||visited.has(nk))continue;const score=g.get(k)!+1;if(score<(g.get(nk)??Infinity)){g.set(nk,score);previous.set(nk,k);open.push(next);}}
 }return null;
}
export type SceneObject={id:string;type:'box'|'sphere'|'cylinder';position:V3;size:number;color:string};
export function sceneCommand(raw:string,current:SceneObject[]):SceneObject[]{
 const c=JSON.parse(raw);if(!c||typeof c!=='object')throw Error('指令须是对象');
 if(c.op==='clear')return[];
 if(c.op==='remove'){if(!Array.isArray(c.ids)||c.ids.some((id:unknown)=>typeof id!=='string'||!current.some(o=>o.id===id)))throw Error('删除 ID 不存在');return current.filter(o=>!c.ids.includes(o.id));}
 if(c.op!=='add'||!Array.isArray(c.objects)||current.length+c.objects.length>40)throw Error('仅支持 add/remove/clear，最多 40 个物体');
 const ids=new Set(current.map(o=>o.id));for(const o of c.objects){if(!o||typeof o.id!=='string'||!o.id||ids.has(o.id))throw Error('物体 ID 缺失或重复');ids.add(o.id);if(!['box','sphere','cylinder'].includes(o.type))throw Error('未知物体类型');if(!Array.isArray(o.position)||o.position.length!==3||o.position.some((n:unknown)=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>20))throw Error('位置需三个有限数，范围 ±20');if(!Number.isFinite(o.size)||o.size<0.05||o.size>5)throw Error('尺寸范围 0.05–5');if(!/^#[0-9a-f]{6}$/i.test(o.color))throw Error('颜色须为六位十六进制');}
 return[...current,...c.objects];
}
export function zScore(samples:number[],value:number){const mean=samples.reduce((a,b)=>a+b,0)/samples.length,variance=samples.reduce((a,b)=>a+(b-mean)**2,0)/samples.length;return Math.abs(value-mean)/Math.max(Math.sqrt(variance),1e-6);}
export type RewriteGraph={nextId:number;edges:[number,number][];steps:number;trace:string[]};
export function rewrite(graph:RewriteGraph,budget:number):RewriteGraph{
 if(graph.nextId>=budget)throw Error('已达节点预算，保留上一完整图');const[a,b]=graph.edges[0],c=graph.nextId;
 return{nextId:c+1,edges:[...graph.edges.slice(1),[a,c],[c,b],[c,(a+b)%c]],steps:graph.steps+1,trace:[...graph.trace,`${a}→${b} 替换为 ${a}→${c}→${b}`]};
}
