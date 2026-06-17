import store from '../../store';
import utils from '../utils';
import Provider from './common/Provider';

// Local workspace provider: persists everything in IndexedDB via localDbSvc.
// Replaces the former googleDriveAppData provider as the default workspace.
export default new Provider({
  id: 'localWorkspace',
  name: 'Local workspace',
  isLocal: true,
  getToken() {
    // No remote token needed for a local-only workspace.
    return store.getters['workspace/syncToken'];
  },
  getWorkspaceParams(workspace) {
    // Carry the workspace id in the URL so reloading reopens it.
    return { providerId: 'localWorkspace', workspace: workspace.id };
  },
  getWorkspaceLocationUrl() {
    // No external location.
    return null;
  },
  getSyncDataUrl() {
    return null;
  },
  getSyncDataDescription({ id }) {
    return id;
  },
  initWorkspace() {
    // Select the local workspace from the URL hash, defaulting to 'main'.
    const workspacesById = store.getters['workspace/workspacesById'];
    const requestedId = utils.queryParams.workspace;
    return (requestedId && workspacesById[requestedId]) || workspacesById.main;
  },
  // Local workspaces never need to fetch remote changes.
  async getChanges() {
    return [];
  },
  onChangesApplied() {},
});
