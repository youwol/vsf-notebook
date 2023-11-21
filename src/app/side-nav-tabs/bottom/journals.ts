import { DockableTabs } from '@youwol/rx-tab-views'
import { AppState } from '../../app.state'
import { RxChildren, VirtualDOM, ChildrenLike } from '@youwol/rx-vdom'

import { asMutable, Immutable, Modules } from '@youwol/vsf-core'
import { BehaviorSubject, from, Observable, Subject } from 'rxjs'
import { HeadersView } from './common'
import { installJournalModule, Journal, JournalModule } from '@youwol/logging'
import * as webpmClient from '@youwol/webpm-client'
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
                    tag: 'div' as const,
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
export class ContentView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: RxChildren<'sync', Modules.ImplementationTrait>

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
        this.children = {
            policy: 'sync',
            source$: buffer$,
            vdomMap: (module) => {
                return {
                    tag: 'div' as const,
                    class: {
                        source$: selected$,
                        vdomMap: (selected: Modules.ImplementationTrait) =>
                            selected && selected.uid == module.uid
                                ? 'h-100 d-flex '
                                : 'd-none',
                    },
                    children: [
                        new TableOfContentView({ selectedPage$, module }),
                        {
                            source$: selectedPage$,
                            vdomMap: (page: Journal.Page) =>
                                new JournalPageView({ page }),
                        },
                    ],
                }
            },
        }
    }
}

export class TableOfContentView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'fv-pointer'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

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
                tag: 'div',
                class: 'ml-2',
                children: module.journal.pages.map((page) => {
                    return {
                        tag: 'div',
                        class: 'fv-pointer d-flex align-items-center',
                        children: [
                            {
                                tag: 'div',
                                class: 'fas fa-file-alt',
                            },
                            {
                                tag: 'div',
                                class: 'mx-1',
                            },
                            {
                                tag: 'div',
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
export class JournalPageView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    static JournalModule$ = () => {
        // @youwol/logging needs to be updated to use webpm-client
        return from(installJournalModule(webpmClient)).pipe(
            shareReplay({ refCount: true, bufferSize: 1 }),
        )
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
    public readonly children: ChildrenLike

    constructor(params: { page: Immutable<Journal.Page> }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'h3',
                class: 'text-center',
                innerText: this.page.title,
            },
            {
                source$: JournalPageView.JournalModule$(),
                vdomMap: (journalModule: JournalModule) => {
                    return {
                        tag: 'div',
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
                },
            },
        ]
    }
}
