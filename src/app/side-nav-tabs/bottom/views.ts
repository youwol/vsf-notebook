import { DockableTabs } from '@youwol/fv-tabs'
import { AppState } from '../../app.state'
import {
    attr$,
    childrenFromStore$,
    VirtualDOM,
    FromStoreChildrenStream$,
} from '@youwol/flux-view'

import { asMutable, Immutable, Modules } from '@youwol/vsf-core'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { HeadersView } from './common'
/**
 * @category View
 */
export class ViewsTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Views',
            title: 'Views',
            icon: 'fas fa-eye',
            content: () => {
                const selected$ = new BehaviorSubject<
                    Immutable<Modules.ImplementationTrait>
                >(undefined)

                state.selectedModulesView$.subscribe((m) => {
                    selected$.next(m.slice(-1)[0])
                })
                return {
                    class: 'w-100 p-2 overflow-auto mx-auto d-flex flex-column',
                    style: {
                        height: '50vh',
                    },
                    children: [
                        new HeadersView({
                            entities$: state.selectedModulesView$,
                            selected$,
                            onClose: (m) => state.closeModuleView(m),
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
export class ContentView implements VirtualDOM {
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
    public readonly children: FromStoreChildrenStream$<Modules.ImplementationTrait>

    constructor({
        state,
        selected$,
    }: {
        state: AppState
        selected$: Subject<Immutable<Modules.ImplementationTrait>>
    }) {
        const buffer$ = asMutable<Observable<Modules.ImplementationTrait[]>>(
            state.selectedModulesView$,
        )
        this.children = childrenFromStore$(buffer$, (module) => {
            return {
                class: attr$(selected$, (selected) =>
                    selected && selected.uid == module.uid
                        ? 'h-100 w-100'
                        : 'h-100 w-100 d-none',
                ),
                children: [module.html()],
            }
        })
    }
}
