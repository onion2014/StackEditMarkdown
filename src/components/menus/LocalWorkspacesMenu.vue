<template>
  <div class="side-bar__panel side-bar__panel--menu">
    <div class="side-bar__info">
      <div class="menu-entry menu-entry--info flex flex--row flex--align-center">
        <div class="menu-entry__icon menu-entry__icon--image">
          <icon-provider provider-id="localWorkspace"></icon-provider>
        </div>
        <span>Workspaces are stored locally in your browser.</span>
      </div>
    </div>
    <menu-entry v-for="workspace in workspaces" :key="workspace.id" @click.native="switchTo(workspace.id)">
      <icon-database slot="icon"></icon-database>
      <div class="flex flex--row">
        <span>{{workspace.name}}</span>
        <span v-if="workspace.id === currentWorkspace.id" class="menu-entry__label menu-entry__label--count">current</span>
      </div>
      <button class="menu-entry__button button" v-if="workspaces.length > 1" @click.stop="remove(workspace)" v-title="'Remove workspace'">
        <icon-delete></icon-delete>
      </button>
    </menu-entry>
    <hr>
    <menu-entry @click.native="create">
      <icon-plus slot="icon"></icon-plus>
      <div>New local workspace</div>
      <span>Create a separate workspace (own file tree).</span>
    </menu-entry>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import MenuEntry from './common/MenuEntry';
import utils from '../../services/utils';
import store from '../../store';

export default {
  components: {
    MenuEntry,
  },
  computed: {
    ...mapGetters('workspace', [
      'currentWorkspace',
    ]),
    workspaces() {
      return Object.values(store.getters['workspace/workspacesById']);
    },
  },
  methods: {
    ...mapActions('data', {
      setPanel: 'setSideBarPanel',
    }),
    async create() {
      // eslint-disable-next-line no-alert
      const name = window.prompt('Name of the new workspace:', '');
      if (!name) {
        return;
      }
      if (Object.values(store.getters['workspace/workspacesById'])
        .some(ws => ws.name === name)) {
        store.dispatch('notification/error', 'A workspace with this name already exists.');
        return;
      }
      const id = utils.uid();
      await store.dispatch('workspace/patchWorkspacesById', {
        [id]: { name },
      });
      this.switchTo(id);
    },
    async remove(workspace) {
      try {
        await store.dispatch('modal/open', { type: 'removeWorkspace', item: workspace });
      } catch (e) { /* Cancel */ return; }
      store.dispatch('workspace/removeWorkspace', workspace.id);
    },
    switchTo(id) {
      // Reloading with the workspace id in the URL hash reopens it.
      utils.setQueryParams({ providerId: 'localWorkspace', workspace: id });
      window.location.reload();
    },
  },
};
</script>
