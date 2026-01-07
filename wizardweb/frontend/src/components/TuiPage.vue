<template>
  <div id="tui-sfc-root">
    <div ref="host"></div>
  </div>
</template>

<script>
export default {
  name: 'TuiPage',
  mounted() {
    try {
      const tpl = document.getElementById('tui-raw-template');
      if (tpl && this.$refs.host) {
        // Wenn es ein <template>-Element ist, nutze dessen content
        const html = tpl.tagName === 'TEMPLATE'
            ? tpl.content?.firstElementChild?.outerHTML || ''
            : tpl.innerHTML || '';
        this.$refs.host.innerHTML = html;
      }
    } catch (e) {
      console.warn('TuiPage inject failed', e);
    }
  },
  beforeUnmount() {
    // Cleanup: entferne eingefügten Inhalt beim Unmount
    if (this.$refs.host) this.$refs.host.innerHTML = '';
  }
}
</script>

<style scoped>
#tui-sfc-root {
  display: block;
  width: 100%;
}
</style>
