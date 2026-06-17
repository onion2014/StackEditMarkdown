import utils from '../services/utils';
import providerRegistry from '../services/providers/common/providerRegistry';

// A dummy token for the local-only workspace. Keeps the syncToken getter truthy
// so existing logic that relies on a workspace token does not break, while
// never triggering any network operation.
const localToken = { isLocal: true, sub: 'local', name: 'Local' };

export default {
  namespaced: true,
  state: {
    currentWorkspaceId: null,
    lastFocus: 0,
  },
  mutations: {
    setCurrentWorkspaceId: (state, value) => {
      state.currentWorkspaceId = value;
    },
    setLastFocus: (state, value) => {
      state.lastFocus = value;
    },
  },
  getters: {
    workspacesById: (state, getters, rootState, rootGetters) => {
      const workspacesById = {};
      Object.entries(rootGetters['data/workspaces']).forEach(([id, workspace]) => {
        const sanitizedWorkspace = {
          id,
          providerId: 'localWorkspace',
          sub: 'local',
          ...workspace,
        };
        // Filter workspaces that don't have a provider
        const workspaceProvider = providerRegistry.providersById[sanitizedWorkspace.providerId];
        if (workspaceProvider) {
          // Build the url with the current hostname
          const params = workspaceProvider.getWorkspaceParams(sanitizedWorkspace);
          sanitizedWorkspace.url = utils.addQueryParams('app', params, true);
          sanitizedWorkspace.locationUrl = workspaceProvider
            .getWorkspaceLocationUrl(sanitizedWorkspace);
          workspacesById[id] = sanitizedWorkspace;
        }
      });
      return workspacesById;
    },
    mainWorkspace: (state, { workspacesById }) => workspacesById.main,
    currentWorkspace: ({ currentWorkspaceId }, { workspacesById, mainWorkspace }) =>
      workspacesById[currentWorkspaceId] || mainWorkspace,
    currentWorkspaceIsGit: (state, { currentWorkspace }) =>
      currentWorkspace.providerId === 'githubWorkspace'
      || currentWorkspace.providerId === 'gitlabWorkspace',
    currentWorkspaceHasUniquePaths: (state, { currentWorkspace }) =>
      currentWorkspace.providerId === 'githubWorkspace'
      || currentWorkspace.providerId === 'gitlabWorkspace',
    lastSyncActivityKey: (state, { currentWorkspace }) => `${currentWorkspace.id}/lastSyncActivity`,
    lastFocusKey: (state, { currentWorkspace }) => `${currentWorkspace.id}/lastWindowFocus`,
    mainWorkspaceToken: () => localToken,
    syncToken: () => localToken,
    loginType: () => 'local',
    loginToken: (state, { loginType, currentWorkspace }, rootState, rootGetters) => {
      const tokensBySub = rootGetters['data/tokensByType'][loginType];
      return tokensBySub && tokensBySub[currentWorkspace.sub];
    },
    sponsorToken: (state, { mainWorkspaceToken }) => mainWorkspaceToken,
  },
  actions: {
    removeWorkspace: ({ commit, rootGetters }, id) => {
      const workspaces = {
        ...rootGetters['data/workspaces'],
      };
      delete workspaces[id];
      commit(
        'data/setItem',
        { id: 'workspaces', data: workspaces },
        { root: true },
      );
    },
    patchWorkspacesById: ({ commit, rootGetters }, workspaces) => {
      const sanitizedWorkspaces = {};
      Object
        .entries({
          ...rootGetters['data/workspaces'],
          ...workspaces,
        })
        .forEach(([id, workspace]) => {
          sanitizedWorkspaces[id] = {
            ...workspace,
            id,
            // Do not store urls
            url: undefined,
            locationUrl: undefined,
          };
        });

      commit(
        'data/setItem',
        { id: 'workspaces', data: sanitizedWorkspaces },
        { root: true },
      );
    },
    setCurrentWorkspaceId: ({ commit, getters }, value) => {
      commit('setCurrentWorkspaceId', value);
      const lastFocus = parseInt(localStorage.getItem(getters.lastFocusKey), 10) || 0;
      commit('setLastFocus', lastFocus);
    },
  },
};
