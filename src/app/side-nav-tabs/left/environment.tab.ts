import { DockableTabs } from '@youwol/fv-tabs'
import { VirtualDOM, child$ } from '@youwol/flux-view'
import { AppState } from '../../app.state'
import { ImmutableTree } from '@youwol/fv-tree'
import {
    NodeWorkersBase,
    WorkersNodeView,
    NodeToolboxesBase,
    LibNodeView,
    NodeLibrariesBase,
} from './environment'
import { NodeView as TbNodeView } from './environment/toolboxes.view'
/**
 * @category View
 */
export class EnvironmentTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Environment',
            title: 'Environment',
            icon: '',
            content: () => {
                return {
                    style: {
                        width: '300px',
                    },
                    children: [new EnvironmentExplorerView({ state: state })],
                }
            },
        })
    }
}

/**
 * @category View
 */
export class EnvironmentExplorerView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly state: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            child$(this.state.envExplorerState$.toolboxes, (state) => {
                return new ImmutableTree.View({
                    state,
                    headerView: (state, node: NodeToolboxesBase) => {
                        return new TbNodeView({ state, node })
                    },
                })
            }),
            child$(this.state.envExplorerState$.libraries, (state) => {
                return new ImmutableTree.View({
                    state,
                    headerView: (state, node: NodeLibrariesBase) => {
                        return new LibNodeView({ state, node })
                    },
                })
            }),
            child$(this.state.envExplorerState$.pools, (state) => {
                return new ImmutableTree.View({
                    state,
                    headerView: (state, node: NodeWorkersBase) => {
                        return new WorkersNodeView({ state, node })
                    },
                })
            }),
        ]
    }
}
