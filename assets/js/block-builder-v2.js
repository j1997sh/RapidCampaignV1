
(() => {
 const qp=new URLSearchParams(location.search), campaignId=qp.get('campaign')||qp.get('rollout')||qp.get('id');
 const cfg=window.RAPID_CAMPAIGN_SUPABASE||window.SUPABASE_CONFIG||{};
 const SUPABASE_URL=cfg.url||window.SUPABASE_URL||'https://lrgljkpgmsjeufyqqqfi.supabase.co';
 const SUPABASE_KEY=cfg.anonKey||cfg.anon_key||cfg.publishableKey||cfg.publishable_key||window.SUPABASE_ANON_KEY||'sb_publishable_ztatvzK3clfYfr9LZDz4Pg_RZuXmuQx';
 let sb=null;
 try{
   if(!window.supabase?.createClient) throw new Error('Supabase library did not load');
   sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 }catch(err){
   console.error('Rapid Campaign builder startup error:',err);
   setTimeout(()=>{
     const n=document.querySelector('#notice');
     if(n){n.textContent='Builder loaded, but the backend connection failed: '+(err?.message||err);n.className='vb-notice error';n.hidden=false;}
   },0);
 }
 const $=s=>document.querySelector(s), canvas=$('#canvas'), editor=$('#editor'), blockModal=$('#blockModal'), assetModal=$('#assetModal');
 let campaign=null, areas=[], blocks=[], selected=null, editorTab='content', areaId='', insertAt=null, dragFrom=null, assetTarget=null;
 const defs={
 header:{icon:'▤',name:'Header',desc:'Logo, navigation and optional CTA',content:{logo:'Campaign',button:'Take action'},settings:{layout:'standard',background:'#ffffff',text:'#071f38'}},
 hero:{icon:'▣',name:'Hero',desc:'Headline, message, media and CTA',content:{eyebrow:'Campaign',headline:'Your campaign headline',copy:'Explain why this campaign matters.',button:'Take action',image:''},settings:{layout:'minimal',background:'#eaf2f8',text:'#071f38',spacing:'large'}},
 text:{icon:'¶',name:'Text',desc:'Heading and campaign copy',content:{title:'Section heading',copy:'Add your campaign copy here.'},settings:{}},
 text_image:{icon:'◫',name:'Text + image',desc:'Editorial two-column section',content:{title:'Tell the story',copy:'Add supporting copy here.',image:''},settings:{layout:'image_right'}},
 image:{icon:'▧',name:'Image',desc:'Full-width campaign photography',content:{image:'',caption:''},settings:{layout:'wide'}},
 video:{icon:'▶',name:'Video',desc:'YouTube or Vimeo video',content:{title:'Watch',url:''},settings:{}},
 points:{icon:'☷',name:'Key points',desc:'Clear campaign arguments',content:{title:'Why this matters',items:['First key point','Second key point','Third key point']},settings:{columns:3}},
 stats:{icon:'123',name:'Statistics',desc:'Evidence or impact numbers',content:{items:[{value:'£0',label:'Statistic'},{value:'0%',label:'Statistic'},{value:'0',label:'Statistic'}]},settings:{columns:3}},
 quote:{icon:'“',name:'Quote',desc:'Endorsement or pull quote',content:{quote:'Add a strong quote here.',name:'Name',role:'Role or organisation'},settings:{layout:'large'}},
 cta:{icon:'→',name:'Call to action',desc:'Focused action section',content:{title:'Ready to take action?',copy:'Join the campaign today.',button:'Take action'},settings:{background:'#0d5f9e',text:'#ffffff'}},
 form:{icon:'✎',name:'Data capture',desc:'Petition, signup, survey or custom form',content:{title:'Add your name',intro:'Join the campaign.',submit:'Take action',thanks:'Thank you — your response has been recorded.',fields:[{id:crypto.randomUUID(),type:'first_name',label:'First name',required:true},{id:crypto.randomUUID(),type:'last_name',label:'Surname',required:true},{id:crypto.randomUUID(),type:'email',label:'Email',required:true},{id:crypto.randomUUID(),type:'postcode',label:'Postcode',required:false}]},settings:{}},
 faq:{icon:'?',name:'FAQ',desc:'Expandable questions and answers',content:{title:'Questions',items:[{q:'What is this campaign asking for?',a:'Add your answer.'}]},settings:{}},
 logos:{icon:'◇',name:'Logos',desc:'Partners or supporting organisations',content:{title:'Supported by',items:[]},settings:{}},
 gallery:{icon:'▦',name:'Gallery',desc:'Campaign image gallery',content:{items:[]},settings:{}},
 share:{icon:'↗',name:'Share',desc:'Help visitors share the campaign',content:{title:'Share this campaign',copy:'Help more people see this campaign.'},settings:{}},
 footer:{icon:'▂',name:'Footer',desc:'Links, privacy and organisation details',content:{name:'Campaign',links:'Privacy · Contact'},settings:{background:'#071f38',text:'#ffffff'}}
 };
 const templates={
 blank:[],
 petition:['header','hero','text','form','share','footer'],
 campaign:['header','hero','text_image','points','stats','cta','form','footer'],
 lead:['header','hero','points','form','footer'],
 report:['header','hero','text','stats','text_image','cta','footer'],
 event:['header','hero','text','form','faq','footer']
 };
 function esc(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
 function notice(t,error=false){const n=$('#notice');n.textContent=t;n.className='vb-notice'+(error?' error':'');n.hidden=false;setTimeout(()=>n.hidden=true,4200)}
 function area(){return areas.find(x=>x.id===areaId)||null}
 function vars(s){const a=area();return String(s??'').replaceAll('{{area}}',a?.area_name||'{{area}}').replaceAll('{{region}}',a?.region||'{{region}}').replaceAll('{{council}}',a?.council||'{{council}}').replaceAll('{{campaign}}',campaign?.name||'{{campaign}}')}
 function effective(b){if(!areaId||!b.override)return b;return {...b,content:{...b.content,...(b.override.content||{})},settings:{...b.settings,...(b.override.settings||{})},visible:b.override.visible??b.visible}}
 function imgStyle(url){return url?`style="background-image:url('${esc(url)}')"`:''}
 function html(b0){const b=effective(b0),c=b.content||{},s=b.settings||{},layout=s.layout||'';if(b.visible===false)return '';
  if(b.type==='header')return `<div class="b-header" style="background:${s.background||'#fff'};color:${s.text||'#071f38'}"><div class="logo">${esc(vars(c.logo))}</div><b>${esc(vars(c.button))}</b></div>`;
  if(b.type==='hero'){const media=c.image?`<div class="b-media" ${imgStyle(c.image)}></div>`:'';return `<div class="b-hero ${layout==='centered'?'center':layout==='split'?'split':layout==='image_background'?'imagebg':''}" style="background:${s.background||'#eaf2f8'};color:${s.text||'#071f38'}"><div><small>${esc(vars(c.eyebrow))}</small><h2>${esc(vars(c.headline))}</h2><p>${esc(vars(c.copy))}</p><span class="b-btn">${esc(vars(c.button))}</span></div>${layout==='split'?media:''}</div>`}
  if(b.type==='text')return `<div class="b-section"><h2>${esc(vars(c.title))}</h2><div class="b-copy">${esc(vars(c.copy))}</div></div>`;
  if(b.type==='text_image')return `<div class="b-section b-split">${layout==='image_left'?`<div class="b-media" ${imgStyle(c.image)}></div>`:''}<div><h2>${esc(vars(c.title))}</h2><div class="b-copy">${esc(vars(c.copy))}</div></div>${layout!=='image_left'?`<div class="b-media" ${imgStyle(c.image)}></div>`:''}</div>`;
  if(b.type==='image')return `<div class="b-section"><div class="b-media" ${imgStyle(c.image)}>${c.image?'':'Image'}</div>${c.caption?`<p>${esc(vars(c.caption))}</p>`:''}</div>`;
  if(b.type==='video')return `<div class="b-section"><h2>${esc(vars(c.title))}</h2><div class="b-media">▶ ${esc(c.url||'Add video URL')}</div></div>`;
  if(b.type==='points')return `<div class="b-section"><h2>${esc(vars(c.title))}</h2><div class="b-points">${(c.items||[]).map(x=>`<div class="b-card">${esc(vars(x))}</div>`).join('')}</div></div>`;
  if(b.type==='stats')return `<div class="b-section"><div class="b-stats">${(c.items||[]).map(x=>`<div class="b-card b-stat"><strong>${esc(vars(x.value))}</strong>${esc(vars(x.label))}</div>`).join('')}</div></div>`;
  if(b.type==='quote')return `<div class="b-section b-quote"><blockquote>“${esc(vars(c.quote))}”</blockquote><p><b>${esc(vars(c.name))}</b> ${esc(vars(c.role))}</p></div>`;
  if(b.type==='cta')return `<div class="b-cta" style="background:${s.background||'#0d5f9e'};color:${s.text||'#fff'}"><h2>${esc(vars(c.title))}</h2><p>${esc(vars(c.copy))}</p><span class="b-btn">${esc(vars(c.button))}</span></div>`;
  if(b.type==='form')return `<div class="b-section b-form"><h2>${esc(vars(c.title))}</h2><p>${esc(vars(c.intro))}</p>${(c.fields||[]).map(f=>`<div class="b-input">${esc(vars(f.label))}${f.required?' *':''}</div>`).join('')}<span class="b-btn">${esc(vars(c.submit))}</span></div>`;
  if(b.type==='faq')return `<div class="b-section"><h2>${esc(vars(c.title))}</h2>${(c.items||[]).map(x=>`<div class="b-faq">${esc(vars(x.q))}<span style="float:right">+</span></div>`).join('')}</div>`;
  if(b.type==='logos')return `<div class="b-section"><h2>${esc(vars(c.title))}</h2><div class="b-media">Supporting logos</div></div>`;
  if(b.type==='gallery')return `<div class="b-section"><div class="b-media">Image gallery</div></div>`;
  if(b.type==='share')return `<div class="b-section"><h2>${esc(vars(c.title))}</h2><p>${esc(vars(c.copy))}</p><b>Share campaign ↗</b></div>`;
  if(b.type==='footer')return `<div class="b-footer" style="background:${s.background||'#071f38'};color:${s.text||'#fff'}"><b>${esc(vars(c.name))}</b><span style="float:right">${esc(vars(c.links))}</span></div>`;
  return '';
 }
 function render(){
  $('#templateStart').style.display=blocks.length?'none':'flex';
  if(!blocks.length){canvas.innerHTML=`<div style="padding:160px 30px;text-align:center;color:#6e8297"><h2 style="color:#071f38">Blank canvas</h2><p>Add the first block above or choose a starting template.</p><button class="vb-btn primary" id="emptyAdd">+ Add block</button></div>`;$('#emptyAdd').onclick=()=>openLibrary(0);return}
  canvas.innerHTML=blocks.map((b,i)=>`<div class="vb-dropzone" data-drop="${i}"></div><div class="vb-addline"><button data-insert="${i}">+</button></div><section draggable="true" class="vb-block ${selected===b.id?'selected':''}" data-id="${b.id}"><div class="vb-drag-handle">⋮⋮ Drag</div><div class="vb-block-tools"><button data-action="dup">Duplicate</button><button data-action="del">Delete</button></div>${html(b)}</section>`).join('')+`<div class="vb-dropzone" data-drop="${blocks.length}"></div><div class="vb-addline"><button data-insert="${blocks.length}">+</button></div>`;
  canvas.querySelectorAll('.vb-block').forEach(el=>{
   el.onclick=e=>{if(e.target.closest('[data-action]'))return;selected=el.dataset.id;render();renderEditor()};
   el.ondragstart=e=>{dragFrom=blocks.findIndex(x=>x.id===el.dataset.id);el.classList.add('dragging');e.dataTransfer.effectAllowed='move'};
   el.ondragend=()=>el.classList.remove('dragging');
  });
  canvas.querySelectorAll('.vb-dropzone').forEach(z=>{z.ondragover=e=>{e.preventDefault();z.classList.add('over')};z.ondragleave=()=>z.classList.remove('over');z.ondrop=e=>{e.preventDefault();z.classList.remove('over');const to=Number(z.dataset.drop);if(dragFrom===null)return;const [m]=blocks.splice(dragFrom,1);blocks.splice(to>dragFrom?to-1:to,0,m);dragFrom=null;render()}});
  canvas.querySelectorAll('[data-insert]').forEach(x=>x.onclick=()=>openLibrary(Number(x.dataset.insert)));
  canvas.querySelectorAll('[data-action]').forEach(x=>x.onclick=e=>{e.stopPropagation();const el=x.closest('.vb-block'),i=blocks.findIndex(b=>b.id===el.dataset.id);if(x.dataset.action==='del')blocks.splice(i,1);else blocks.splice(i+1,0,{...structuredClone(blocks[i]),id:crypto.randomUUID(),override:null});selected=null;render();renderEditor()});
 }
 function input(label,key,type='text',scope='content'){const b=blocks.find(x=>x.id===selected),src=(areaId&&b?.override?.[scope])||b?.[scope]||{},v=src[key]??((scope==='content'?b?.content:b?.settings)||{})[key]??'';return `<div class="vb-field"><label>${label}</label>${type==='textarea'?`<textarea data-bind="${scope}.${key}">${esc(v)}</textarea>`:type==='color'?`<input type="color" data-bind="${scope}.${key}" value="${esc(v||'#ffffff')}">`:`<input data-bind="${scope}.${key}" value="${esc(v)}">`}</div>`}
 function select(label,key,opts,scope='settings'){const b=blocks.find(x=>x.id===selected),src=(areaId&&b?.override?.[scope])||b?.[scope]||{},v=src[key]??b?.[scope]?.[key]??'';return `<div class="vb-field"><label>${label}</label><select data-bind="${scope}.${key}">${opts.map(([x,l])=>`<option value="${x}" ${x===v?'selected':''}>${l}</option>`).join('')}</select></div>`}
 function mediaPicker(key='image'){const b=blocks.find(x=>x.id===selected),src=areaId&&b?.override?.content?b.override.content:b?.content||{},v=src[key]||b?.content?.[key]||'';return `<div class="vb-field"><label>Image</label>${v?`<div class="b-media" style="height:120px;min-height:120px;background-image:url('${esc(v)}');background-size:cover;background-position:center"></div>`:''}<div style="display:flex;gap:7px;margin-top:7px"><button class="vb-btn" id="chooseImage">Choose / upload</button>${v?'<button class="vb-btn vb-danger" id="removeImage">Remove</button>':''}</div></div>`}
 function contentTab(b){
  let s=''; if(b.type==='header')s=input('Logo / campaign name','logo')+input('Button','button');
  else if(b.type==='hero')s=input('Eyebrow','eyebrow')+input('Headline','headline')+input('Copy','copy','textarea')+input('Button','button')+mediaPicker();
  else if(b.type==='text')s=input('Heading','title')+input('Copy','copy','textarea');
  else if(b.type==='text_image')s=input('Heading','title')+input('Copy','copy','textarea')+mediaPicker();
  else if(b.type==='image')s=mediaPicker()+input('Caption','caption');
  else if(b.type==='video')s=input('Heading','title')+input('Video URL','url');
  else if(b.type==='quote')s=input('Quote','quote','textarea')+input('Name','name')+input('Role','role');
  else if(b.type==='cta')s=input('Heading','title')+input('Copy','copy','textarea')+input('Button','button');
  else if(b.type==='form')s=formEditor(b);
  else if(['points','faq','share','logos'].includes(b.type))s=input('Heading','title')+(b.content.copy!==undefined?input('Copy','copy','textarea'):'')+`<p class="vb-help">Structured item editing will preserve your existing entries. Use AI or duplicate blocks for faster variants.</p>`;
  else s=`<p class="vb-help">This block has no required text content.</p>`;
  return s;
 }
 function designTab(b){
  let s=`<div class="vb-grid2">${input('Background','background','color','settings')}${input('Text colour','text','color','settings')}</div>`;
  if(b.type==='hero')s+=select('Hero layout','layout',[['minimal','Minimal'],['centered','Centred'],['split','Split image'],['image_background','Image background']]);
  if(b.type==='text_image')s+=select('Image position','layout',[['image_right','Image right'],['image_left','Image left']]);
  if(['stats','points'].includes(b.type))s+=select('Columns','columns',[['2','Two'],['3','Three'],['4','Four']]);
  s+=select('Spacing','spacing',[['compact','Compact'],['normal','Normal'],['large','Large']]);
  s+=select('Content width','width',[['standard','Standard'],['wide','Wide'],['full','Full width']]);
  return s;
 }
 function localTab(b){
  if(!areaId)return `<p class="vb-help">Choose a constituency or ward from <strong>Editing</strong> above to create an override. Master content remains unchanged.</p>`;
  const a=area();return `<div style="padding:10px 12px;background:#edf7ff;border:1px solid #b3d8f2;margin-bottom:15px"><strong>${esc(a.area_name)}</strong><div class="vb-help">Only fields you change here override the master page.</div></div>${contentTab(b)}<button class="vb-btn vb-danger" id="clearOverride">Clear this area's overrides</button>`;
 }
 function formEditor(b){
  const c=(areaId&&b.override?.content)||b.content, fields=c.fields||[];
  return input('Heading','title')+input('Introduction','intro','textarea')+input('Submit button','submit')+input('Thank-you message','thanks','textarea')+
   `<div class="vb-field"><label>Fields</label><div class="vb-form-fields">${fields.map((f,i)=>`<div class="vb-form-row" data-fi="${i}"><span class="drag">⋮⋮</span><input data-formlabel="${i}" value="${esc(f.label)}"><label style="font-size:11px"><input type="checkbox" data-required="${i}" ${f.required?'checked':''}> Required</label><button data-fdel="${i}">×</button></div>`).join('')}</div></div>`+
   `<div class="vb-field"><label>Add field</label><div class="vb-form-add">${[['first_name','First name'],['last_name','Surname'],['email','Email'],['phone','Phone'],['postcode','Postcode'],['text','Text'],['textarea','Long text'],['select','Dropdown'],['radio','Radio'],['checkbox','Checkbox'],['consent','Consent']].map(([t,l])=>`<button data-addfield="${t}">+ ${l}</button>`).join('')}</div></div>`;
 }
 function renderEditor(){
  const b=blocks.find(x=>x.id===selected);if(!b){editor.innerHTML='<div class="vb-editor-empty"><strong>Select a block</strong><p>Click any block on the canvas to edit it.</p></div>';return}
  editor.innerHTML=`<div class="vb-editor-head"><div><strong>${defs[b.type]?.name||b.type}</strong><small>${areaId?'Local override · '+esc(area()?.area_name||''):'Master block'}</small></div><button class="vb-btn" id="closeEdit">×</button></div><div class="vb-tabs"><button data-tab="content" class="${editorTab==='content'?'active':''}">Content</button><button data-tab="design" class="${editorTab==='design'?'active':''}">Design</button><button data-tab="local" class="${editorTab==='local'?'active':''}">Localisation</button></div><div class="vb-editor-body">${editorTab==='content'?contentTab(b):editorTab==='design'?designTab(b):localTab(b)}<hr style="border:0;border-top:1px solid #d9e1e8;margin:20px 0"><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="vb-btn ai" id="aiRewrite">✦ Rewrite</button><button class="vb-btn ai" id="aiHeadlines">✦ 3 headlines</button></div></div>`;
  $('#closeEdit').onclick=()=>{selected=null;render();renderEditor()};editor.querySelectorAll('[data-tab]').forEach(x=>x.onclick=()=>{editorTab=x.dataset.tab;renderEditor()});
  editor.querySelectorAll('[data-bind]').forEach(x=>x.oninput=()=>setBound(b,x.dataset.bind,x.value));
  $('#chooseImage')?.addEventListener('click',()=>openAssets('image'));$('#removeImage')?.addEventListener('click',()=>{setBound(b,'content.image','');render();renderEditor()});
  editor.querySelectorAll('[data-formlabel]').forEach(x=>x.oninput=()=>mutateFields(b,fs=>fs[Number(x.dataset.formlabel)].label=x.value));
  editor.querySelectorAll('[data-required]').forEach(x=>x.onchange=()=>mutateFields(b,fs=>fs[Number(x.dataset.required)].required=x.checked));
  editor.querySelectorAll('[data-fdel]').forEach(x=>x.onclick=()=>mutateFields(b,fs=>fs.splice(Number(x.dataset.fdel),1),true));
  editor.querySelectorAll('[data-addfield]').forEach(x=>x.onclick=()=>mutateFields(b,fs=>fs.push({id:crypto.randomUUID(),type:x.dataset.addfield,label:{first_name:'First name',last_name:'Surname',email:'Email',phone:'Phone',postcode:'Postcode',text:'Question',textarea:'Your answer',select:'Choose one',radio:'Choose one',checkbox:'Option',consent:'I agree'}[x.dataset.addfield],required:false}),true));
  $('#clearOverride')?.addEventListener('click',()=>{b.override=null;render();renderEditor()});
  $('#aiRewrite').onclick=()=>ai('rewrite_block',{block:effective(b)},out=>{if(out.content){if(areaId){b.override=b.override||{content:{},settings:{}};b.override.content={...b.override.content,...out.content}}else b.content={...b.content,...out.content};render();renderEditor()}});
  $('#aiHeadlines').onclick=()=>ai('headlines',{block:effective(b)},out=>{if(out.headlines?.length)alert(out.headlines.join('\n\n'))});
 }
 function setBound(b,path,val){const [scope,key]=path.split('.');if(areaId){b.override=b.override||{content:{},settings:{},visible:null};b.override[scope]=b.override[scope]||{};b.override[scope][key]=val}else{b[scope]=b[scope]||{};b[scope][key]=val}render()}
 function mutateFields(b,fn,rer=false){let target;if(areaId){b.override=b.override||{content:{},settings:{}};b.override.content=b.override.content||{};if(!b.override.content.fields)b.override.content.fields=structuredClone(b.content.fields||[]);target=b.override.content}else target=b.content;fn(target.fields||(target.fields=[]));render();if(rer)renderEditor()}
 function openLibrary(pos=null){insertAt=pos;blockModal.hidden=false}
 function add(type){const d=defs[type],b={id:crypto.randomUUID(),type,content:structuredClone(d.content),settings:structuredClone(d.settings||{}),visible:true,override:null};blocks.splice(insertAt===null?blocks.length:insertAt,0,b);blockModal.hidden=true;selected=b.id;render();renderEditor()}
 function applyTemplate(name){blocks=(templates[name]||[]).map(t=>({id:crypto.randomUUID(),type:t,content:structuredClone(defs[t].content),settings:structuredClone(defs[t].settings||{}),visible:true,override:null}));selected=null;render();renderEditor()}
 async function openAssets(key){if(!sb){notice('Backend connection is not available.',true);return}assetTarget={block:blocks.find(x=>x.id===selected),key};assetModal.hidden=false;await loadAssets()}
 async function loadAssets(){const {data,error}=await sb.storage.from('campaign-assets').list(campaignId||'',{limit:100,sortBy:{column:'created_at',order:'desc'}});if(error){$('#assetGrid').innerHTML=`<p>${esc(error.message)}</p>`;return}$('#assetGrid').innerHTML=(data||[]).filter(x=>!x.id||x.metadata).map(x=>{const {data:u}=sb.storage.from('campaign-assets').getPublicUrl(`${campaignId}/${x.name}`);return `<div class="vb-asset" data-url="${esc(u.publicUrl)}"><img src="${esc(u.publicUrl)}"><small>${esc(x.name)}</small></div>`}).join('')||'<p class="vb-help">No campaign images yet.</p>';document.querySelectorAll('.vb-asset').forEach(x=>x.onclick=()=>pickAsset(x.dataset.url))}
 function pickAsset(url){const b=assetTarget.block;if(areaId){b.override=b.override||{content:{},settings:{}};b.override.content[assetTarget.key]=url}else b.content[assetTarget.key]=url;assetModal.hidden=true;render();renderEditor()}
 async function uploadAsset(file){const ext=file.name.split('.').pop()||'jpg',path=`${campaignId}/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${ext}`,{error}=await sb.storage.from('campaign-assets').upload(path,file,{upsert:false});if(error)throw error;const {data}=sb.storage.from('campaign-assets').getPublicUrl(path);pickAsset(data.publicUrl)}
 async function ai(action,extra,done){try{if(!sb)throw new Error('Backend connection is not available.');notice('AI is working…');const {data:{session}}=await sb.auth.getSession();const r=await fetch(`${cfg.url}/functions/v1/campaign-ai-blocks`,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({campaign_id:campaignId,action,blocks:blocks.map(effective),...extra})}),d=await r.json();if(!r.ok)throw new Error(d.error||'AI request failed');done(d.output||{});notice('AI suggestion ready.')}catch(e){notice(e.message||String(e),true)}}
 async function save(){try{if(!sb)throw new Error('Backend connection is not available.');const serial=blocks.map(({override,...b})=>b);const {error}=await sb.rpc('org_admin_save_campaign_page',{p_campaign:campaignId,p_page_settings:{},p_blocks:serial});if(error)throw error;if(areaId){for(const b of blocks){if(!b.override)continue;const {error:oe}=await sb.rpc('org_admin_save_block_override',{p_block:b.id,p_area:areaId,p_content:b.override.content||{},p_settings:b.override.settings||{},p_visible:b.override.visible??null});if(oe)throw oe}}notice('Page saved.')}catch(e){notice(e.message||String(e),true)}}
 async function load(){
  if(!sb){notice('Builder is available, but the backend connection is not available.',true);render();renderEditor();return}
  if(!campaignId){notice('Missing campaign ID.',true);return}
  const [{data:c},{data:a}]=await Promise.all([sb.from('campaigns').select('name').eq('id',campaignId).single(),sb.rpc('org_admin_campaign_areas_for_builder',{p_campaign:campaignId})]);campaign=c;areas=a||[];$('#campaignName').textContent=c?.name||'Campaign';
  $('#areaMode').innerHTML='<option value="">Master page</option>'+areas.map(x=>`<option value="${x.id}">${esc(x.area_name)}</option>`).join('');
  await loadPage();
 }
 async function loadPage(){const {data,error}=await sb.rpc('org_admin_campaign_page_with_overrides',{p_campaign:campaignId,p_area:areaId||null});if(error){notice(error.message,true);return}blocks=(data?.blocks||[]).map(x=>({...x,id:x.id||crypto.randomUUID()}));render();renderEditor()}
 $('#blockLibrary').innerHTML=Object.entries(defs).map(([k,d])=>`<div class="vb-library-card" data-type="${k}"><div class="vb-library-icon">${d.icon}</div><b>${d.name}</b><span>${d.desc}</span></div>`).join('');document.querySelectorAll('.vb-library-card').forEach(x=>x.onclick=()=>add(x.dataset.type));
 $('#closeBlockModal').onclick=()=>blockModal.hidden=true;$('#closeAssetModal').onclick=()=>assetModal.hidden=true;$('#addBlockTop').onclick=()=>openLibrary(blocks.length);
 $('#assetUpload').onchange=async e=>{if(e.target.files?.[0])try{await uploadAsset(e.target.files[0]);notice('Image uploaded.')}catch(err){notice(err.message,true)}e.target.value=''};
 document.querySelectorAll('[data-template]').forEach(x=>x.onclick=()=>applyTemplate(x.dataset.template));
 document.querySelectorAll('[data-device]').forEach(x=>x.onclick=()=>{document.querySelectorAll('[data-device]').forEach(y=>y.classList.remove('active'));x.classList.add('active');canvas.classList.toggle('mobile',x.dataset.device==='mobile')});
 $('#areaMode').onchange=async e=>{areaId=e.target.value;$('#modeHelp').textContent=areaId?`Previewing and editing ${area()?.area_name}. Changes become local overrides.`:'Changes apply to every local version.';selected=null;await loadPage()};
 $('#saveBtn').onclick=save;$('#previewBtn').onclick=()=>{const a=area();const slug=a?.slug||areas[0]?.slug;if(slug)window.open(`public-site.html?slug=${encodeURIComponent(slug)}`,'_blank');else notice('Add at least one campaign area before previewing.',true)};
 $('#aiBuild').onclick=()=>ai('build_page',{},out=>{if(out.blocks?.length){blocks=out.blocks.map(x=>({id:crypto.randomUUID(),type:x.type,content:x.content||{},settings:x.settings||{},visible:true,override:null}));render();renderEditor()}});
 $('#aiSuggest').onclick=()=>ai('suggest_block',{},out=>{if(out.type&&defs[out.type]){const b={id:crypto.randomUUID(),type:out.type,content:{...structuredClone(defs[out.type].content),...(out.content||{})},settings:structuredClone(defs[out.type].settings||{}),visible:true,override:null};blocks.push(b);selected=b.id;render();renderEditor();notice(out.reason||'Suggested block added.')}});
 document.querySelectorAll('[data-campaign-link]').forEach(a=>a.href+=(a.href.includes('?')?'&':'?')+'campaign='+encodeURIComponent(campaignId||''));
 load();
})();
