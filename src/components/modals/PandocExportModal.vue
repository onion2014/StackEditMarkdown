<template>
  <modal-inner aria-label="Export with Pandoc">
    <div class="modal__content">
      <p class="modal__info modal__info--multiline">
        <b>Pandoc export is not available</b> in this build. Pandoc multi-format conversion
        (EPUB, DOCX, ODT, LaTeX, …) requires a backend service, which is not included in the
        pure front-end version of StackEdit.
      </p>
      <p v-if="selectedFormat !== 'pdf'">
        For <b>PDF</b> export, use <a href="javascript:void(0)" @click="openPdfExport">PDF export</a> instead.
      </p>
    </div>
    <div class="modal__button-bar">
      <button class="button" @click="config.reject()">Close</button>
    </div>
  </modal-inner>
</template>

<script>
import modalTemplate from './common/modalTemplate';
import store from '../../store';

export default modalTemplate({
  computedLocalSettings: {
    selectedFormat: 'pandocExportFormat',
  },
  methods: {
    async openPdfExport() {
      try {
        await store.dispatch('modal/open', 'pdfExport');
      } catch (e) { /* Cancel */ }
    },
  },
});
</script>
