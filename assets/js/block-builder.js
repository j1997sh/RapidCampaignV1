
(() => {
 const qs=new URLSearchParams(location.search), campaignId=qs.get('campaign')||qs.get('rollout')||qs.get('id');
 const cfg=window.RAPID_CAMPAIGN_SUPABASE||window.SUPABASE_CONFIG||{};
 const url=cfg.url||window.SUPABASE_URL, key=cfg.anonKey||cfg.anon_key||window.SUPABASE_ANON_KEY;
 const sb=window.supabase.createClient(url,key);
 let page={settings:{}}, blocks=[], selected=null, insertAt=null;
 const defs={
 header:{icon:'▤',name:'Header',desc:'Logo, navigation and optional action',content:{logo:'Campaign',button:'Take action'}},
 hero:{icon:'▣',name:'Hero',desc:'Headline, campaign message, media and CTA',content:{eyebrow:'Campaign',headline:'Your campaign headline',copy:'Explain why this campaign matters and what you want people to do.',button:'Take action'}},
 text:{icon:'¶',name:'Text',desc:'Heading and rich campaign copy',content:{title:'Section heading',copy:'Add your campaign copy here.'}},
 text_image:{icon:'◫',name:'Text + image',desc:'Editorial two-column section',content:{title:'Tell the story',copy:'Add supporting campaign copy here.',image:''}},
 image:{icon:'▧',name:'Image',desc:'Full-width campaign photography or graphic',content:{image:'',caption:''}},
 video:{icon:'▶',name:'Video',desc:'YouTube, Vimeo or campaign video',content:{title:'Watch',url:''}},
 points:{icon:'☷',name:'Key points',desc:'Two to six clear campaign arguments',content:{title:'Why this matters',items:['First key point','Second key point','Third key point']}},
 stats:{icon:'123',name:'Statistics',desc:'Large evidence or impact numbers',content:{items:[{value:'£0',label:'Example statistic'},{value:'0%',label:'Example statistic'},{value:'0',label:'Example statistic'}]}},
 quote:{icon:'“',name:'Quote',desc:'Endorsement, testimony or pull quote',content:{quote:'Add a strong quote here.',name:'Name',role:'Role or organisation'}},
 cta:{icon:'→',name:'Call to action',desc:'Focused standalone action section',content:{title:'Ready to take action?',copy:'Join the campaign today.',button:'Take action'}},
 form:{icon:'✎',name:'Data capture',desc:'Petition, signup, survey or custom form',content:{title:'Add your name',intro:'Join the campaign.',submit:'Take action',fields:[{type:'first_name',label:'First name',required:true},{type:'last_name',label:'Surname',required:true},{type:'email',label:'Email',required:true},{type:'postcode',label:'Postcode',required:false}]}},
 faq:{icon:'?',name:'FAQ',desc:'Expandable questions and answers',content:{title:'Questions',items:[{q:'What is this campaign asking for?',a:'Add your answer.'}]}},
 logos:{icon:'◇',name:'Logos',desc:'Supporting organisations or partners',content:{title:'Supported by',items:[]}},
 gallery:{icon:'▦',name:'Gallery',desc:'Campaign images in a simple grid',content:{items:[]}},
 share:{icon:'↗',name:'Share',desc:'Encourage visitors to share the campaign',content:{title:'Share this campaign',copy:'Help more people see this campaign.'}},
 footer:{icon:'▂',name:'Footer',desc:'Logo, links, privacy and organisation details',content:{name:'Campaign',links:'Privacy · Contact'}}
 };
 const $=s=>document.querySelector(s), canvas=$('#canvas'), editor=$('#editor'), modal=$('#blockModal');
 function notice(t,error=false){const n=$('#notice');n.textContent=t;n.className='bb-notice'+(error?' error':'');n.hidden=false;setTimeout(()=>n.hidden=true,4500)}
 function esc(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
 function blockHtml(b){
  const c=b.content||{};
  switch(b.type){
   case'header':return `<div class="block-header"><div class="logo">${esc(c.logo)}</div><b>${esc(c.button)}</b></div>`;
   case'hero':return `<div class="block-hero"><small>${esc(c.eyebrow)}</small><h2>${esc(c.headline)}</h2><p>${esc(c.copy)}</p><span class="block-button">${esc(c.button)}</span></div>`;
   case'text':return `<div class="block-text"><h2>${esc(c.title)}</h2><div class="block-copy">${esc(c.copy)}</div></div>`;
   case'text_image':return `<div class="block-text block-split"><div><h2>${esc(c.title)}</h2><div class="block-copy">${esc(c.copy)}</div></div><div class="placeholder-image">${c.image?'Image selected':'Image'}</div></div>`;
   case'image':return `<div class="block-image"><div class="placeholder-image">${c.image?'Image selected':'Full-width image'}</div>${c.caption?`<p>${esc(c.caption)}</p>`:''}</div>`;
   case'video':return `<div class="block-video"><h2>${esc(c.title)}</h2><div class="placeholder-image">▶ ${esc(c.url||'Add video URL')}</div></div>`;
   case'points':return `<div class="block-points"><h2>${esc(c.title)}</h2><div class="point-grid">${(c.items||[]).map(x=>`<div class="point">${esc(x)}</div>`).join('')}</div></div>`;
   case'stats':return `<div class="block-stats"><div class="stat-grid">${(c.items||[]).map(x=>`<div class="stat"><strong>${esc(x.value)}</strong>${esc(x.label)}</div>`).join('')}</div></div>`;
   case'quote':return `<div class="block-quote"><blockquote>“${esc(c.quote)}”</blockquote><p><b>${esc(c.name)}</b> ${esc(c.role)}</p></div>`;
   case'cta':return `<div class="block-cta"><h2>${esc(c.title)}</h2><p>${esc(c.copy)}</p><span class="block-button">${esc(c.button)}</span></div>`;
   case'form':return `<div class="block-form"><h2>${esc(c.title)}</h2><p>${esc(c.intro)}</p>${(c.fields||[]).slice(0,5).map(f=>`<div class="fake-input">${esc(f.label)}${f.required?' *':''}</div>`).join('')}<span class="block-button">${esc(c.submit)}</span></div>`;
   case'faq':return `<div class="block-faq"><h2>${esc(c.title)}</h2>${(c.items||[]).map(x=>`<div class="faq">${esc(x.q)} <span style="float:right">+</span></div>`).join('')}</div>`;
   case'logos':return `<div class="block-logos"><h2>${esc(c.title)}</h2><div class="placeholder-image">Supporting logos</div></div>`;
   case'gallery':return `<div class="block-gallery"><div class="placeholder-image">Image gallery</div></div>`;
   case'share':return `<div class="block-share"><h2>${esc(c.title)}</h2><p>${esc(c.copy)}</p><b>Share campaign ↗</b></div>`;
   case'footer':return `<div class="block-footer"><b>${esc(c.name)}</b><span style="float:right">${esc(c.links)}</span></div>`;
   default:return `<div class="block-text">Block</div>`;
  }
 }
 function render(){
  $('#emptyState')?.remove();
  if(!blocks.length){canvas.innerHTML=`<div id="emptyState" class="bb-empty"><div class="bb-empty-icon">+</div><h2>Your page is empty</h2><p>Start with a blank canvas and add only the blocks this campaign needs.</p><button class="bb-btn primary" id="emptyAdd">+ Add first block</button><button class="bb-btn ai" id="aiBuild">✦ Build page with AI</button></div>`;bindEmpty();return}
  canvas.innerHTML=blocks.map((b,i)=>`<div class="bb-add-between"><button data-insert="${i}">+</button></div><section class="bb-block ${selected===b.id?'selected':''}" data-id="${b.id}"><div class="bb-block-tools"><button data-act="up">↑</button><button data-act="down">↓</button><button data-act="dup">Duplicate</button><button data-act="del">Delete</button></div>${blockHtml(b)}</section>`).join('')+`<div class="bb-add-between"><button data-insert="${blocks.length}">+</button></div>`;
  canvas.querySelectorAll('.bb-block').forEach(el=>el.onclick=e=>{if(e.target.closest('[data-act]'))return;selected=el.dataset.id;render();renderEditor()});
  canvas.querySelectorAll('[data-insert]').forEach(x=>x.onclick=()=>openLibrary(Number(x.dataset.insert)));
  canvas.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const id=btn.closest('.bb-block').dataset.id,i=blocks.findIndex(x=>x.id===id),a=btn.dataset.act;if(a==='del')blocks.splice(i,1);if(a==='dup')blocks.splice(i+1,0,{...structuredClone(blocks[i]),id:crypto.randomUUID()});if(a==='up'&&i>0)[blocks[i-1],blocks[i]]=[blocks[i],blocks[i-1]];if(a==='down'&&i<blocks.length-1)[blocks[i+1],blocks[i]]=[blocks[i],blocks[i+1]];render()});
 }
 function field(label,key,type='text'){const b=blocks.find(x=>x.id===selected),v=b?.content?.[key]??'';return `<div class="bb-field"><label>${label}</label>${type==='textarea'?`<textarea data-key="${key}">${esc(v)}</textarea>`:`<input data-key="${key}" value="${esc(v)}">`}</div>`}
 function renderEditor(){
  const b=blocks.find(x=>x.id===selected);if(!b){editor.innerHTML='<div class="bb-editor-empty"><strong>Select a block</strong><p>Click any block on the page to edit it.</p></div>';return}
  let body='';
  if(b.type==='header')body=field('Logo / name','logo')+field('Button','button');
  else if(b.type==='hero')body=field('Eyebrow','eyebrow')+field('Headline','headline')+field('Copy','copy','textarea')+field('Button','button');
  else if(['text','text_image'].includes(b.type))body=field('Heading','title')+field('Copy','copy','textarea')+(b.type==='text_image'?field('Image URL','image'):'');
  else if(b.type==='image')body=field('Image URL','image')+field('Caption','caption');
  else if(b.type==='video')body=field('Heading','title')+field('Video URL','url');
  else if(b.type==='quote')body=field('Quote','quote','textarea')+field('Name','name')+field('Role','role');
  else if(b.type==='cta')body=field('Heading','title')+field('Copy','copy','textarea')+field('Button','button');
  else if(b.type==='form')body=field('Heading','title')+field('Introduction','intro','textarea')+field('Submit button','submit')+`<div class="bb-field"><label>Form fields</label><p style="color:#70839a;font-size:12px">First name, surname, email and postcode are included. Custom field editor comes next.</p></div>`;
  else if(['faq','points','logos','share'].includes(b.type))body=field('Heading','title')+(b.content.copy!==undefined?field('Copy','copy','textarea'):'')+`<p style="font-size:12px;color:#70839a">Structured item editing is available from this block's advanced controls.</p>`;
  else body=`<p style="color:#70839a">This block has layout controls but no required text.</p>`;
  editor.innerHTML=`<div class="bb-editor-head"><div><strong>${defs[b.type]?.name||b.type}</strong><div style="font-size:12px;color:#70839a;margin-top:3px">Master block</div></div><button class="bb-btn" id="closeEdit">×</button></div><div class="bb-editor-body">${body}<hr style="border:0;border-top:1px solid #d8e0e8;margin:20px 0"><div class="bb-field"><label>Background</label><input type="color" data-setting="background" value="${b.settings?.background||'#ffffff'}"></div><div class="bb-field"><label>Spacing</label><select data-setting="spacing"><option>Normal</option><option>Compact</option><option>Large</option></select></div><button class="bb-btn ai" id="aiBlock">✦ Rewrite with AI</button></div>`;
  $('#closeEdit').onclick=()=>{selected=null;render();renderEditor()};
  editor.querySelectorAll('[data-key]').forEach(x=>x.oninput=()=>{b.content[x.dataset.key]=x.value;render()});
  editor.querySelectorAll('[data-setting]').forEach(x=>x.oninput=()=>{b.settings=b.settings||{};b.settings[x.dataset.setting]=x.value});
  $('#aiBlock').onclick=()=>notice('AI block rewriting is connected through the campaign AI assistant.');
 }
 function openLibrary(pos=null){insertAt=pos;modal.hidden=false}
 function add(type){const d=defs[type],b={id:crypto.randomUUID(),type,content:structuredClone(d.content),settings:{},visible:true};if(insertAt===null||insertAt>blocks.length)blocks.push(b);else blocks.splice(insertAt,0,b);modal.hidden=true;selected=b.id;render();renderEditor()}
 function bindEmpty(){ $('#emptyAdd')?.addEventListener('click',()=>openLibrary(0));$('#aiBuild')?.addEventListener('click',()=>location.href=`campaign-ai.html?campaign=${encodeURIComponent(campaignId)}&action=improve_site`) }
 $('#blockLibrary').innerHTML=Object.entries(defs).map(([k,d])=>`<div class="bb-library-card" data-type="${k}"><div class="bb-library-icon">${d.icon}</div><b>${d.name}</b><span>${d.desc}</span></div>`).join('');
 document.querySelectorAll('.bb-library-card').forEach(x=>x.onclick=()=>add(x.dataset.type));
 $('#closeModal').onclick=()=>modal.hidden=true;$('#addTop').onclick=()=>openLibrary(blocks.length);
 $('#saveBtn').onclick=async()=>{try{const {error}=await sb.rpc('org_admin_save_campaign_page',{p_campaign:campaignId,p_page_settings:page.settings||{},p_blocks:blocks});if(error)throw error;notice('Page saved.')}catch(e){notice(e.message||String(e),true)}};
 $('#previewBtn').onclick=()=>{const w=window.open('','_blank');w.document.write(`<html><head><title>Preview</title><link rel="stylesheet" href="${location.origin+location.pathname.replace(/[^/]+$/,'')}assets/css/block-builder.css"></head><body><div class="bb-canvas">${blocks.map(blockHtml).join('')}</div></body></html>`);w.document.close()};
 document.querySelectorAll('[data-device]').forEach(x=>x.onclick=()=>{document.querySelectorAll('[data-device]').forEach(y=>y.classList.remove('active'));x.classList.add('active');canvas.classList.toggle('mobile',x.dataset.device==='mobile')});
 document.querySelectorAll('[data-campaign-link]').forEach(a=>{a.href+=(a.href.includes('?')?'&':'?')+'campaign='+encodeURIComponent(campaignId||'')});
 async function load(){if(!campaignId){notice('Missing campaign ID.',true);return}const {data:c}=await sb.from('campaigns').select('name').eq('id',campaignId).single();if(c)$('#campaignName').textContent=c.name;const {data,error}=await sb.rpc('org_admin_campaign_page',{p_campaign:campaignId});if(error){notice(error.message,true);return}if(data){page=data.page||{settings:{}};blocks=(data.blocks||[]).map(x=>({...x,id:x.id||crypto.randomUUID()}))}render();bindEmpty()}
 bindEmpty();load();
})();
