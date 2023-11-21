import { DockableTabs } from '@youwol/rx-tab-views'
import { AppState } from '../../app.state'

import { Configurations, Immutable, Modules } from '@youwol/vsf-core'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { ObjectJs } from '@youwol/rx-tree-views'
/**
 * @category View
 */
export class ConfigTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Config.',
            title: 'Config.',
            icon: 'fas fa-cog',
            content: () => {
                return {
                    tag: 'div',
                    class: 'h-100 p-2 overflow-auto',
                    style: {
                        width: '300px',
                    },
                    children: [
                        {
                            source$: state.selectedConfigurable$,
                            vdomMap: (
                                module: Immutable<Modules.ImplementationTrait>,
                            ) => ({
                                tag: 'h3',
                                class: 'fv-bg-background-alt text-center',
                                innerText: module.uid,
                            }),
                        },
                        {
                            source$: state.selectedConfigurable$,
                            vdomMap: (
                                configurable: Immutable<Modules.ImplementationTrait>,
                            ) =>
                                new ConfigurationView({
                                    configurable,
                                }),
                        },
                    ],
                }
            },
        })
    }
}
/**
 * @category View
 */
export class ConfigurationView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'px-2 fv-bg-background-alt w-100 h-100 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor({
        configurable,
    }: {
        configurable: Immutable<
            Configurations.ConfigurableTrait<Configurations.Schema>
        >
    }) {
        const state = new ObjectJs.State({
            title: '',
            data: configurable.configurationInstance,
            expandedNodes: ['_0'],
        })
        this.children = [new ObjectJs.View({ state })]
    }
}
