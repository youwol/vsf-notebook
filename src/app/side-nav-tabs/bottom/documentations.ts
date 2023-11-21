import { DockableTabs } from '@youwol/rx-tab-views'
import { AppState } from '../../app.state'

import { asMutable, Immutable, Modules } from '@youwol/vsf-core'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { HeadersView } from './common'
import { RxChildren, VirtualDOM } from '@youwol/rx-vdom'
/**
 * @category View
 */
export class DocumentationsTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Documentations',
            title: 'Documentations',
            icon: 'fas fa-question',
            content: () => {
                const selected$ = new BehaviorSubject<
                    Immutable<Modules.ImplementationTrait>
                >(undefined)

                state.selectedModulesDocumentation$.subscribe((m) => {
                    selected$.next(m.slice(-1)[0])
                })
                return {
                    tag: 'div',
                    class: 'w-100 p-2 overflow-auto mx-auto d-flex flex-column',
                    style: {
                        height: '50vh',
                    },
                    children: [
                        new HeadersView({
                            entities$: state.selectedModulesDocumentation$,
                            selected$,
                            onClose: (m) => state.closeModuleDocumentation(m),
                            text: (m) => m.uid,
                        }),

                        new ContentView({ state, selected$ }),
                    ],
                }
            },
        })
    }
}

/**
 * @category View
 */
export class ContentView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 flex-grow-1'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = { minHeight: '0px' }

    /**
     * @group Observables
     */
    public readonly children: RxChildren<'sync', Modules.ImplementationTrait>

    constructor({
        state,
        selected$,
    }: {
        state: AppState
        selected$: Subject<Immutable<Modules.ImplementationTrait>>
    }) {
        const buffer$ = asMutable<Observable<Modules.ImplementationTrait[]>>(
            state.selectedModulesDocumentation$,
        )
        this.children = {
            policy: 'sync',
            source$: buffer$,
            vdomMap: (module) => {
                return {
                    tag: 'div',
                    class: {
                        source$: selected$,
                        vdomMap: (
                            selected: Immutable<Modules.ImplementationTrait>,
                        ) =>
                            selected && selected.uid == module.uid
                                ? 'h-100 w-100'
                                : 'h-100 w-100 d-none',
                    },
                    children: [
                        {
                            tag: 'iframe',
                            src: module.factory.declaration.documentation,
                            height: '100%',
                            width: '100%',
                        },
                    ],
                }
            },
        }
    }
}
