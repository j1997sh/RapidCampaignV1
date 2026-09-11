
(() => {
  const cfg = window.RAPID_CAMPAIGN_SUPABASE || window.SUPABASE_CONFIG || {};
  const url = cfg.url || window.SUPABASE_URL || 'https://lrgljkpgmsjeufyqqqfi.supabase.co';
  const key = cfg.anonKey || cfg.anon_key || cfg.publishableKey || cfg.publishable_key || window.SUPABASE_ANON_KEY || 'sb_publishable_ztatvzK3clfYfr9LZDz4Pg_RZuXmuQx';

  const esc = value => String(value ?? '').replace(/[&<>"]/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
  }[ch]));

  function findCampaignLink() {
    return [...document.querySelectorAll('.rc-sidebar nav a, aside nav a, nav a')]
      .find(a => (a.textContent || '').trim().toLowerCase() === 'campaigns');
  }

  async function init() {
    const campaignsLink = findCampaignLink();
    if (!campaignsLink || campaignsLink.dataset.rcEnhanced === '1') return;
    campaignsLink.dataset.rcEnhanced = '1';

    const wrap = document.createElement('div');
    wrap.className = 'rc-campaigns-group';
    campaignsLink.parentNode.insertBefore(wrap, campaignsLink);
    wrap.appendChild(campaignsLink);

    campaignsLink.classList.add('rc-campaigns-parent');
    campaignsLink.insertAdjacentHTML('beforeend', '<span class="rc-campaigns-chevron">⌄</span>');

    const sub = document.createElement('div');
    sub.className = 'rc-campaigns-subnav';
    sub.innerHTML = '<div class="rc-campaigns-loading">Loading campaigns…</div>';
    wrap.appendChild(sub);

    const currentId = new URLSearchParams(location.search).get('campaign');
    const shouldOpen = !!currentId || location.pathname.includes('campaign');
    wrap.classList.toggle('open', shouldOpen);

    campaignsLink.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      wrap.classList.toggle('open');
    });

    try {
      if (!window.supabase?.createClient) throw new Error('Supabase unavailable');
      const sb = window.supabase.createClient(url, key);
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        sub.innerHTML = '<a class="rc-campaign-all" href="campaigns.html">View all campaigns</a>';
        return;
      }

      const { data: memberships } = await sb
        .from('organisation_memberships')
        .select('organisation_id')
        .eq('user_id', user.id);

      const orgIds = (memberships || []).map(x => x.organisation_id).filter(Boolean);
      let q = sb.from('campaigns').select('id,name,status,updated_at').order('updated_at', { ascending: false }).limit(12);
      if (orgIds.length) q = q.in('organisation_id', orgIds);
      const { data, error } = await q;
      if (error) throw error;

      const rows = (data || []).map(c => `
        <a href="campaign-overview.html?campaign=${encodeURIComponent(c.id)}" class="rc-campaign-item ${currentId === c.id ? 'active' : ''}">
          <span class="rc-campaign-dot ${c.status === 'live' ? 'live' : ''}"></span>
          <span class="rc-campaign-name">${esc(c.name || 'Untitled campaign')}</span>
        </a>`).join('');

      sub.innerHTML = rows + '<a class="rc-campaign-all" href="campaigns.html">View all campaigns</a>';
    } catch (err) {
      console.warn('Could not load campaign sidebar:', err);
      sub.innerHTML = '<a class="rc-campaign-all" href="campaigns.html">View all campaigns</a>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
