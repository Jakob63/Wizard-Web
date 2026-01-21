<template>
  <main class="container py-3">
    <div id="tui">
      <p v-for="(line, idx) in lines" :key="idx">{{ line }}</p>
    </div>
  </main>
</template>

<script>
export default {
  name: 'TuiPage',
  props: {
    toRender: { type: String, default: '' }
  },
  computed: {
    text(){
      // Priority: prop -> URL query (?tui= or ?text=) -> window.TUI_TEXT
      try { if (this.toRender && this.toRender.length) return this.toRender; } catch(_){}
      try {
        const url = new URL(window.location.href);
        const q = url.searchParams.get('tui') || url.searchParams.get('text') || '';
        if (q) return q;
      } catch(_) {}
      try { if (window.TUI_TEXT) return String(window.TUI_TEXT); } catch(_) {}
      return '';
    },
    lines(){
      try { return String(this.text || '').split('\n'); } catch(_) { return []; }
    }
  }
}
</script>

<style>
/* Minimal styling; uses Bootstrap from index.html and global main.less */
</style>
