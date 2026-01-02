<template>
  <div class="card">
    <div v-if="!noTitle" class="title">Scoreboard</div>
    <table>
      <thead>
      <tr><th>Player</th><th>Bid</th><th>Points</th></tr>
      </thead>
      <tbody>
      <tr v-for="(s, i) in scores" :key="i">
        <td>
            <span class="player-cell">
              <span class="avatar-badge" :title="s.name">{{ abbr(s.name) }}</span>
              <button type="button" class="copy-link" @click="copyLink(s.name)">{{ s.name }}</button>
            </span>
        </td>
        <td>{{ Number(s.bid || 0) }}</td>
        <td>{{ Number(s.points || 0) }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'WizardScore',
  props: {
    scores: { type: Array, default: () => [] },
    noTitle: { type: Boolean, default: false }
  },
  methods: {
    abbr(name){
      const n = String(name || '').trim();
      if (!n) return '?';
      const parts = n.split(/\s+/).filter(Boolean);
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || n[0].toUpperCase();
    },
    async copyLink(name){
      try {
        const origin = window.location.origin;
        const url = origin + '/play/' + encodeURIComponent(name || '');
        await navigator.clipboard.writeText(url);
        try { window.toastr?.success('Link kopiert'); } catch(_) {}
      } catch(_) {
        try { window.toastr?.error('Kopieren fehlgeschlagen'); } catch(_) {}
      }
    }
  }
}
</script>

<style scoped>
.card{ border:0; border-radius:0; padding:0; background:transparent; }
.title{ font-weight:600; margin-bottom:.5rem; }
table{ width:100%; border-collapse: collapse; }
th, td{ border-bottom:1px solid rgba(0,0,0,0.08); padding:6px 8px; text-align:left; }
th{ background:transparent; font-weight:600; }
tr:last-child td{ border-bottom:none; }
.player-cell{ display:inline-flex; align-items:center; gap:6px; }
.avatar-badge{
  display:inline-flex; align-items:center; justify-content:center;
  width:24px; height:24px; border-radius:50%;
  background:#eef; color:#345; font-weight:600; font-size:12px;
  border:1px solid rgba(0,0,0,0.08);
  box-sizing:border-box;
}
.copy-link{ all:unset; display:inline; color:inherit; cursor:pointer; }
:global(html[data-bs-theme="dark"]) th,
:global(html[data-bs-theme="dark"]) td{ border-bottom-color: rgba(255,255,255,0.12); color:#e9eef6; }
:global(html[data-bs-theme="dark"]) .avatar-badge{ background:#223; color:#cfe; border-color: rgba(255,255,255,0.12); }
</style>
