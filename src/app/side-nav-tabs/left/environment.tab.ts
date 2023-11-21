import { DockableTabs } from '@youwol/rx-tab-views'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState } from '../../app.state'
import { ImmutableTree } from '@youwol/rx-tree-views'
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
                    tag: 'div',
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
export class EnvironmentExplorerView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group States
     */
    public readonly state: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            {
                source$: this.state.envExplorerState$.toolboxes,
                vdomMap: (state: ImmutableTree.State<NodeToolboxesBase>) => {
                    return new ImmutableTree.View({
                        state,
                        headerView: (state, node: NodeToolboxesBase) => {
                            return new TbNodeView({ state, node })
                        },
                    })
                },
            },
            {
                source$: this.state.envExplorerState$.libraries,
                vdomMap: (state: ImmutableTree.State<NodeLibrariesBase>) => {
                    return new ImmutableTree.View({
                        state,
                        headerView: (state, node: NodeLibrariesBase) => {
                            return new LibNodeView({ state, node })
                        },
                    })
                },
            },
            {
                source$: this.state.envExplorerState$.pools,
                vdomMap: (state: ImmutableTree.State<NodeWorkersBase>) => {
                    return new ImmutableTree.View({
                        state,
                        headerView: (state, node: NodeWorkersBase) => {
                            return new WorkersNodeView({ state, node })
                        },
                    })
                },
            },
        ]
    }
}
