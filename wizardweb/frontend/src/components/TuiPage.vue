<template>
  <div id="tui-sfc-root">
    <div ref="host"></div>
  </div>
</template>

<script>
export default {
  name: 'TuiPage',
  mounted(){
    try {
      const tpl = document.getElementById('tui-raw-template');
      if (tpl && this.$refs.host) {
        const html = tpl.tagName === 'TEMPLATE' ? (tpl.innerHTML || tpl.content?.firstElementChild?.outerHTML || '') : tpl.innerHTML;
        this.$refs.host.innerHTML = html;
      }
    } catch(e) {
      console.warn('TuiPage inject failed', e);
    }
  }
}
</script>

<style scoped>
#tui-sfc-root { display:block; }
</style>
