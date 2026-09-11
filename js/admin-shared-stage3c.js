(async function(){
'use strict';
const sb=window.cpSupabase;

function currentFile(){return (location.pathname.split('/').pop()||'campaigns.html').toLowerCase()}
function campaignId(){const q=new URLSearchParams(location.search);return q.get('id')||q.get('rollout')||q.get('campaign')||''}
function href(file,id){return id?`${file}?id=${encodeURIComponent(id)}`:file}
function isCampaignPage(file){return /^campaign-(overview|build|pages|website|forms|overrides|routing|creative|graphics|advertise|meta|people|supporters|results|setup|integrations|domain|settings)\.html$/.test(file)}
function campaignSection(file){
 const map={
  'campaign-overview.html':'overview','campaign-build.html':'build','campaign-pages.html':'build','campaign-website.html':'build','campaign-forms.html':'build','campaign-overrides.html':'build','campaign-routing.html':'build',
  'campaign-creative.html':'creative','campaign-graphics.html':'creative','creatives.html':'creative',
  'campaign-advertise.html':'advertising','campaign-meta.html':'advertising','ads-campaign.html':'advertising',
  'campaign-people.html':'responses','campaign-supporters.html':'responses','campaign-results.html':'results',
  'campaign-setup.html':'setup','campaign-integrations.html':'setup','campaign-domain.html':'setup','campaign-settings.html':'setup'
 };
 return map[file]||'';
}
function injectNavCss(){
 if(document.querySelector('link[data-rc-nav-v9]'))return;
 const l=document.createElement('link');l.rel='stylesheet';l.href='assets/css/rapid-navigation-v9.css?v=20260911-v9';l.dataset.rcNavV9='1';document.head.appendChild(l);
}
function sidebarMarkup(file,id,name){
 const campaignOpen=!!id && (isCampaignPage(file)||file==='creatives.html'||file==='ads-campaign.html');
 const active=campaignSection(file);
 const globalActive=file==='campaigns.html'?'dashboard':file==='audiences.html'?'audiences':file==='geography.html'?'geography':file==='attribution.html'?'results':'';
 const sub=campaignOpen?`<div class="rc-nav-campaign-group">
   <div class="rc-nav-campaign-label"><span>CAMPAIGN</span><strong data-rc-sidebar-campaign>${name||'Campaign'}</strong></div>
   <a class="${active==='overview'?'active':''}" href="${href('campaign-overview.html',id)}">Overview</a>
   <a class="${active==='build'?'active':''}" href="${href('campaign-build.html',id)}">Build</a>
   <a class="rc-nav-child" href="${href('campaign-pages.html',id)}">Pages</a>
   <a class="rc-nav-child" href="${href('campaign-forms.html',id)}">Forms</a>
   <a class="${active==='creative'?'active':''}" href="${href('campaign-creative.html',id)}">Creative</a>
   <a class="${active==='advertising'?'active':''}" href="${href('campaign-advertise.html',id)}">Advertising</a>
   <a class="${active==='responses'?'active':''}" href="${href('campaign-people.html',id)}">Responses</a>
   <a class="${active==='results'?'active':''}" href="${href('campaign-results.html',id)}">Results</a>
   <a class="${active==='setup'?'active':''}" href="${href('campaign-setup.html',id)}">Setup</a>
  </div>`:'';
 return `<a class="rc-unified-brand" href="campaigns.html"><span>RC</span><b>Rapid Campaign</b></a>
 <nav class="rc-unified-nav">
   <a class="${globalActive==='dashboard'?'active':''}" href="campaigns.html"><i>⌁</i><span>Dashboard</span></a>
   <div class="rc-nav-parent ${campaignOpen?'open':''}"><a class="${campaignOpen?'active-parent':''}" href="campaigns.html"><i>▤</i><span>Campaigns</span><em>${campaignOpen?'−':'›'}</em></a>${sub}</div>
   <a class="${globalActive==='audiences'?'active':''}" href="audiences.html"><i>◎</i><span>Audience library</span></a>
   <a href="creatives.html"><i>◫</i><span>Creative library</span></a>
   <a class="${globalActive==='results'?'active':''}" href="attribution.html"><i>↗</i><span>Results</span></a>
   <div class="rc-unified-rule"></div>
   <a href="campaign-wizard.html"><i>＋</i><span>New campaign</span></a>
   <a class="${globalActive==='geography'?'active':''}" href="geography.html"><i>⌖</i><span>Geography</span></a>
 </nav>
 <div class="rc-unified-sidebar-bottom"><a data-rc-logout href="#">Log out</a></div>`;
}
function installUnifiedSidebar(){
 injectNavCss();
 const file=currentFile(),id=campaignId();
 const aside=document.querySelector('.rc-product-sidebar,.v18-sidebar,.admin-sidebar');
 if(!aside)return;
 aside.classList.add('rc-unified-sidebar');
 aside.innerHTML=sidebarMarkup(file,id,'Campaign');
 const logout=aside.querySelector('[data-rc-logout]');
 if(logout)logout.onclick=async e=>{e.preventDefault();try{await sb.auth.signOut()}finally{sessionStorage.removeItem('cp_admin_org');location.replace('login.html')}};
 if(id&&window.CP_ADMIN){hydrateSidebarCampaign(id)}
}
async function hydrateSidebarCampaign(id){
 try{
  const r=await sb.rpc('org_admin_central_campaign_rollout',{p_rollout:id});
  const title=r.data?.rollout?.title||r.data?.campaign?.name||'';
  if(title)document.querySelectorAll('[data-rc-sidebar-campaign]').forEach(x=>x.textContent=title);
 }catch(e){console.warn('Could not load sidebar campaign name',e)}
}

try{
  injectNavCss();installUnifiedSidebar();
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError) throw sessionError;
  if(!session){location.replace('login.html');return;}
  const ctx=await sb.rpc('rapid_campaign_current_admin_context');
  if(ctx.error) throw ctx.error;
  const membership=Array.isArray(ctx.data)?ctx.data[0]:ctx.data;
  if(!membership){await sb.auth.signOut();location.replace('login.html');return;}
  const org=membership.organisation_id;
  sessionStorage.setItem('cp_admin_org',org);
  window.CP_ADMIN={sb,orgId:org,role:membership.role,orgName:membership.organisation_name||'Rapid Campaign'};
  document.querySelectorAll('[data-admin-org-name]').forEach(x=>x.textContent=window.CP_ADMIN.orgName);
  const badge=document.getElementById('adminRoleBadge');if(badge)badge.textContent=membership.role==='global_admin'?'Global admin':'Regional admin';
  document.querySelectorAll('.admin-nav a').forEach(a=>a.classList.toggle('active',a.dataset.adminNav===window.CP_ADMIN_ACTIVE));
  const logout=document.getElementById('adminLogout');if(logout)logout.onclick=async()=>{await sb.auth.signOut();sessionStorage.removeItem('cp_admin_org');location.replace('login.html')};
  installUnifiedSidebar();
  const id=campaignId();if(id)await hydrateSidebarCampaign(id);
  const readyEventDetail=window.CP_ADMIN;
  window.dispatchEvent(new CustomEvent('cp-admin-ready',{detail:readyEventDetail}));
  document.dispatchEvent(new CustomEvent('cp-admin-ready',{detail:readyEventDetail}));
}catch(err){
  console.error('Rapid Campaign admin bootstrap failed',err);
  const target=document.querySelector('.admin-content')||document.body;
  const d=document.createElement('div');d.className='state-banner error';d.textContent=err?.message||'Could not load Rapid Campaign admin.';target.prepend(d);
}
})();
