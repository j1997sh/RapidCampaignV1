(function(){
 let started=false;
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const ago=d=>{if(!d)return'';const n=new Date(d),s=Math.max(0,(Date.now()-n)/1000);if(s<60)return'just now';if(s<3600)return`${Math.floor(s/60)} min ago`;if(s<86400)return`${Math.floor(s/3600)} hr ago`;if(s<172800)return'yesterday';return n.toLocaleDateString('en-GB',{day:'numeric',month:'short'})};
 async function init(){
  if(started||!window.CP_ADMIN)return;started=true;
  const {sb}=window.CP_ADMIN,$=id=>document.getElementById(id),list=$('centralCampaignsList'),filter=$('centralCampaignStatusFilter'),activity=$('rapidActivityFeed');let rows=[];
  const typeOf=r=>{const m=r.package?.settings?.mode;if(m==='ads_only'||r.category==='ads_only')return['Ads only','ads-campaign.html'];if(m==='landing_page'||r.category==='landing_page')return['Landing page','landing-campaign.html'];return['Campaign + website','campaign-overview.html']};
  function statusLabel(r){return String(r.launch_state||r.status||'draft').replaceAll('_',' ')}
  function statusClass(r){const s=statusLabel(r).toLowerCase();return s.includes('live')?'live':s.includes('draft')?'draft':s.includes('paused')?'paused':'neutral'}
  function drawSidebar(){
    const side=document.getElementById('sideCampaignsList');
    if(!side)return;
    side.innerHTML=rows.length?rows.slice(0,10).map(r=>{
      const[type,page]=typeOf(r),href=`${page}?id=${encodeURIComponent(r.id)}`;
      return `<a class="rc-side-campaign-link" href="${href}" title="${esc(r.title)}">
        <span class="rc-side-status ${statusClass(r)}"></span>
        <span>${esc(r.title)}</span>
      </a>`
    }).join('')+`<a class="rc-side-view-all" href="#campaigns">View all campaigns</a>`:
    '<div class="rc-side-empty">No campaigns yet</div>';
  }
  function draw(){
    const f=filter?.value||'',shown=rows.filter(x=>!f||x.status===f);
    drawSidebar();
    if(!shown.length){list.innerHTML='<div class="ops-empty"><strong>No campaigns yet</strong><span>Create your first campaign when you are ready.</span></div>';return}
    list.innerHTML=`<div class="rc-campaign-table">
      <div class="rc-campaign-table-head">
        <span>Campaign</span><span>Type</span><span>Status</span><span>Updated</span><span></span>
      </div>
      ${shown.map(r=>{
        const[type,page]=typeOf(r),href=`${page}?id=${encodeURIComponent(r.id)}`,updated=r.updated_at?new Date(r.updated_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
        return `<div class="rc-campaign-table-row">
          <div class="rc-campaign-primary">
            <a href="${href}">${esc(r.title)}</a>
            ${r.summary?`<small>${esc(r.summary)}</small>`:''}
          </div>
          <div class="rc-campaign-type">${esc(type)}</div>
          <div><span class="rc-status-pill ${statusClass(r)}"><i></i>${esc(statusLabel(r))}</span></div>
          <div class="rc-campaign-updated">${esc(updated)}</div>
          <div class="rc-campaign-actions">
            <a class="rc-open-btn" href="${href}">Open</a>
            <button class="rc-more-btn" type="button" data-more="${r.id}" aria-label="More actions">•••</button>
            <div class="rc-row-menu" data-menu="${r.id}" hidden>
              <button data-dup="${r.id}" type="button">Duplicate</button>
              <button class="danger" data-del="${r.id}" type="button">Delete campaign</button>
            </div>
          </div>
        </div>`
      }).join('')}
    </div>`
  }
  async function drawActivity(orgId){
   const [supporters,visits]=await Promise.all([sb.from('campaign_supporters').select('id,campaign_id,action_type,created_at,campaigns(name)').eq('organisation_id',orgId).order('created_at',{ascending:false}).limit(8),sb.from('campaign_visits').select('id,campaign_id,created_at,campaigns(name)').eq('organisation_id',orgId).order('created_at',{ascending:false}).limit(5)]);
   const events=[];(supporters.data||[]).forEach(x=>events.push({at:x.created_at,icon:'+',html:`New ${esc(x.action_type||'response')} on <a href="campaign-supporters.html?id=${encodeURIComponent(x.campaign_id)}">${esc(x.campaigns?.name||'campaign')}</a>`}));(visits.data||[]).forEach(x=>events.push({at:x.created_at,icon:'↗',html:`Visit recorded for <a href="campaign-results.html?id=${encodeURIComponent(x.campaign_id)}">${esc(x.campaigns?.name||'campaign')}</a>`}));rows.slice(0,5).forEach(x=>events.push({at:x.updated_at||x.created_at,icon:'•',html:`Campaign <a href="${typeOf(x)[1]}?id=${encodeURIComponent(x.id)}">${esc(x.title)}</a> was updated`}));events.sort((a,b)=>new Date(b.at)-new Date(a.at));const shown=events.slice(0,12);activity.innerHTML=shown.length?shown.map(e=>`<div class="rc-activity-row"><span class="rc-activity-dot">${e.icon}</span><div class="rc-activity-copy">${e.html}<small>${esc(ago(e.at))}</small></div><span class="rc-activity-time">${new Date(e.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join(''):'<div class="rc-activity-empty">Activity will appear here as campaigns are created, visited and receive responses.</div>';
  }
  async function load(){list.innerHTML='<div class="ops-loading">Loading campaigns…</div>';const c=await sb.rpc('rapid_campaign_current_admin_context');if(c.error||!c.data?.length){list.innerHTML='<div class="ops-error"><strong>Campaigns could not be loaded.</strong></div>';return}const orgId=c.data[0].organisation_id;const[r,s]=await Promise.all([sb.rpc('org_admin_central_campaign_rollouts',{p_org:orgId}),sb.rpc('rapid_campaign_home_stats')]);if(r.error){list.innerHTML=`<div class="ops-error"><strong>Campaigns could not be loaded.</strong><span>${esc(r.error.message)}</span></div>`;return}rows=r.data||[];draw();if(!s.error&&s.data){$('homeCampaignCount').textContent=s.data.campaigns??0;$('homeLiveCount').textContent=s.data.live_campaigns??0;$('homePageCount').textContent=s.data.local_pages??0;$('homeSupporterCount').textContent=s.data.supporters??0}await drawActivity(orgId)}
  const sideGroup=document.getElementById('sideCampaignsGroup'),sideToggle=document.getElementById('sideCampaignsToggle');
  sideToggle?.addEventListener('click',()=>sideGroup?.classList.toggle('open'));
  document.addEventListener('click',e=>{
    const more=e.target.closest('[data-more]');
    if(more){
      e.stopPropagation();
      const menu=list?.querySelector(`[data-menu="${more.dataset.more}"]`);
      list?.querySelectorAll('.rc-row-menu').forEach(m=>{if(m!==menu)m.hidden=true});
      if(menu)menu.hidden=!menu.hidden;
      return;
    }
    if(!e.target.closest('.rc-row-menu')) list?.querySelectorAll('.rc-row-menu').forEach(m=>m.hidden=true);
  });
  filter?.addEventListener('change',draw);list?.addEventListener('click',async e=>{const dup=e.target.closest('[data-dup]');if(dup){const source=rows.find(x=>x.id===dup.dataset.dup),name=prompt('Name for the duplicate',`${source?.title||'Campaign'} copy`);if(!name)return;const r=await sb.rpc('org_admin_duplicate_central_campaign_rollout',{p_rollout:dup.dataset.dup,p_title:name});if(r.error)return alert(r.error.message);return load()}const del=e.target.closest('[data-del]');if(del){const source=rows.find(x=>x.id===del.dataset.del);if(!confirm(`Delete ${source?.title||'this campaign'}?`))return;const r=await sb.rpc('org_admin_delete_central_campaign_rollout',{p_rollout:del.dataset.del});if(r.error)return alert(r.error.message);return load()}});await load();
 }
 if(window.CP_ADMIN)init().catch(console.error);else window.addEventListener('cp-admin-ready',()=>init().catch(console.error),{once:true});
})();
