import { DockableTabs } from '@youwol/fv-tabs'
import { AppState } from '../../app.state'
import {
    attr$,
    childrenFromStore$,
    VirtualDOM,
    FromStoreChildrenStream$,
    child$,
} from '@youwol/flux-view'

import { asMutable, Immutable, Immutables, Modules } from '@youwol/vsf-core'
import { BehaviorSubject, from, Observable, Subject } from 'rxjs'
import { HeadersView } from './common'
import { installJournalModule, Journal } from '@youwol/logging'
import * as webpmClient from '@youwol/webpm-client'
import type * as cdnClient from '@youwol/cdn-client'
import { shareReplay } from 'rxjs/operators'
/**
 * @category View
 */
export class JournalsTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Journals',
            title: 'Journals',
            icon: 'fas fa-newspaper',
            content: () => {
                const selected$ = new BehaviorSubject<
                    Immutable<Modules.ImplementationTrait>
                >(undefined)

                state.selectedModulesJournal$.subscribe((m) => {
                    selected$.next(m.slice(-1)[0])
                })
                return {
                    class: 'w-100 p-2 overflow-auto mx-auto d-flex flex-column',
                    style: {
                        height: '50vh',
                    },
                    children: [
                        new HeadersView({
                            entities$: state.selectedModulesJournal$,
                            selected$,
                            onClose: (m) => state.closeModuleJournal(m),
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
    public readonly class = 'w-100 flex-grow-1 mx-2'
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
            state.selectedModulesJournal$,
        )
        const selectedPage$ = new Subject<Journal.Page>()
        this.children = childrenFromStore$(buffer$, (module) => {
            return {
                class: attr$(selected$, (selected) =>
                    selected && selected.uid == module.uid
                        ? 'h-100 d-flex '
                        : 'd-none',
                ),
                children: [
                    new TableOfContentView({ selectedPage$, module }),
                    child$(
                        selectedPage$,
                        (page) => new JournalPageView({ page }),
                    ),
                ],
            }
        })
    }
}

export class TableOfContentView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'fv-pointer'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor({
        module,
        selectedPage$,
    }: {
        module: Immutable<Modules.ImplementationTrait>
        selectedPage$: Subject<Immutable<Journal.Page>>
    }) {
        this.children = [
            {
                tag: 'h3',
                innerText: 'Table of contents',
                style: { whiteSpace: 'nowrap' },
            },
            {
                class: 'ml-2',
                children: module.journal.pages.map((page) => {
                    return {
                        class: 'fv-pointer d-flex align-items-center',
                        children: [
                            {
                                class: 'fas fa-file-alt',
                            },
                            {
                                class: 'mx-1',
                            },
                            {
                                innerText: page.title,
                            },
                        ],
                        onclick: () => {
                            selectedPage$.next(page)
                        },
                    }
                }),
            },
        ]
    }
}
/**
 * @category View
 */
export class JournalPageView implements VirtualDOM {
    static JournalModule$ = () => {
        // @youwol/logging needs to be updated to use webpm-client
        return from(
            installJournalModule(webpmClient as unknown as typeof cdnClient),
        ).pipe(shareReplay({ refCount: true, bufferSize: 1 }))
    }
    /**
     * @group Immutable Attributes
     */
    public readonly page: Immutable<Journal.Page>

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'flex-grow-1 h-100 overflow-auto d-flex flex-column'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: Immutables<VirtualDOM>

    constructor(params: { page: Immutable<Journal.Page> }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'h3',
                class: 'text-center',
                innerText: this.page.title,
            },
            child$(JournalPageView.JournalModule$(), (journalModule) => {
                return {
                    class: 'w-100 flex-grow-1',
                    style: { minHeight: '0px' },
                    children: [
                        new journalModule.ContextView({
                            state: new journalModule.ContextState({
                                context: asMutable(this.page.entryPoint),
                                expandedNodes: [this.page.entryPoint.id],
                            }),
                            dataViewsFactory: [],
                            options: {
                                containerClass:
                                    'p-4 flex-grow-1 overflow-auto w-100',
                            },
                        }),
                    ],
                }
            }),
        ]
    }
}
