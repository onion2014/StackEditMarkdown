<template>
  <modal-inner aria-label="Export to PDF">
    <div class="modal__content">
      <p>Please choose a template for your <b>PDF export</b>.</p>
      <form-entry label="Template">
        <select class="textfield" slot="field" v-model="selectedTemplate" @keydown.enter="resolve()">
          <option v-for="(template, id) in allTemplatesById" :key="id" :value="id">
            {{ template.name }}
          </option>
        </select>
        <div class="form-entry__actions">
          <a href="javascript:void(0)" @click="configureTemplates">Configure templates</a>
        </div>
      </form-entry>
      <form-entry label="Page size">
        <select class="textfield" slot="field" v-model="selectedFormat">
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
        </select>
      </form-entry>
      <p class="modal__info">PDF export renders your document in the browser using an image-based snapshot of the preview.</p>
    </div>
    <div class="modal__button-bar">
      <button class="button" :disabled="isExporting" @click="config.reject()">Cancel</button>
      <button class="button button--resolve" :disabled="isExporting" @click="resolve()">Ok</button>
    </div>
  </modal-inner>
</template>

<script>
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import FileSaver from 'file-saver';
import exportSvc from '../../services/exportSvc';
import modalTemplate from './common/modalTemplate';
import store from '../../store';
import badgeSvc from '../../services/badgeSvc';

export default modalTemplate({
  computedLocalSettings: {
    selectedTemplate: 'pdfExportTemplate',
    selectedFormat: 'pdfExportFormat',
  },
  data: () => ({
    isExporting: false,
  }),
  methods: {
    async resolve() {
      if (this.isExporting) {
        return;
      }
      this.isExporting = true;
      this.config.resolve();
      const currentFile = store.getters['file/current'];
      try {
        await store.dispatch('queue/enqueue', async () => {
          // Render the template HTML (fully client-side via Handlebars worker)
          const html = await exportSvc.applyTemplate(
            currentFile.id,
            this.allTemplatesById[this.selectedTemplate],
            true,
          );

          // Render into an offscreen container so html2canvas can snapshot it
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.left = '-99999px';
          container.style.top = '0';
          container.style.width = '780px';
          container.style.background = '#ffffff';
          container.style.padding = '24px';
          container.innerHTML = html;
          document.body.appendChild(container);

          try {
            const canvas = await html2canvas(container, {
              scale: 2,
              backgroundColor: '#ffffff',
              useCORS: true,
            });

            // Slice the tall canvas into PDF pages
            // eslint-disable-next-line new-cap
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'pt',
              format: this.selectedFormat,
            });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            // Scale the image width to the page width
            const imgHeight = (canvas.height / canvas.width) * pageWidth;
            const imgData = canvas.toDataURL('image/jpeg', 0.92);

            if (imgHeight <= pageHeight) {
              pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
            } else {
              // Render the full image, then create a page per visible slice
              // eslint-disable-next-line new-cap
              const renderedPdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: this.selectedFormat,
              });
              let heightLeft = imgHeight;
              let position = 0;
              renderedPdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
              heightLeft -= pageHeight;
              while (heightLeft > 0) {
                position -= pageHeight;
                renderedPdf.addPage();
                renderedPdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
                heightLeft -= pageHeight;
              }
              const blob = renderedPdf.output('blob');
              FileSaver.saveAs(blob, `${currentFile.name}.pdf`);
              badgeSvc.addBadge('exportPdf');
              return;
            }

            const blob = pdf.output('blob');
            FileSaver.saveAs(blob, `${currentFile.name}.pdf`);
            badgeSvc.addBadge('exportPdf');
          } finally {
            document.body.removeChild(container);
          }
        });
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        store.dispatch('notification/error', err);
      } finally {
        this.isExporting = false;
      }
    },
  },
});
</script>
