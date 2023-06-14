import { DockableTabs } from '@youwol/fv-tabs'
import { AppState } from '../../app.state'

import {
    ConfigurableTrait,
    Immutable,
    Immutables,
    Schema,
} from '@youwol/vsf-core'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { ObjectJs } from '@youwol/fv-tree'
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
                    class: 'h-100 p-2 overflow-auto',
                    style: {
                        width: '300px',
                    },
                    children: [
                        child$(state.selectedConfigurable$, (module) => ({
                            tag: 'h3',
                            class: 'fv-bg-background-alt text-center',
                            innerText: module.uid,
                        })),
                        child$(
                            state.selectedConfigurable$,
                            (configurable) =>
                                new ConfigurationView({
                                    configurable,
                                }),
                        ),
                    ],
                }
            },
        })
    }
}
/**
 * @category View
 */
export class ConfigurationView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'px-2 fv-bg-background-alt w-100 h-100 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: Immutables<VirtualDOM>

    constructor({
        configurable,
    }: {
        configurable: Immutable<ConfigurableTrait<Schema>>
    }) {
        const state = new ObjectJs.State({
            title: '',
            data: configurable.configurationInstance,
            expandedNodes: ['_0'],
        })
        this.children = [new ObjectJs.View({ state })]
    }
}
