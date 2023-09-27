import { DockableTabs } from '@youwol/fv-tabs'
import { Common } from '@youwol/fv-code-mirror-editors'
import { child$, childrenFromStore$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../../../app.state'
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'
import { Projects, Immutable, asMutable } from '@youwol/vsf-core'
import {
    CellMarkdownState,
    cellMarkdownView,
    TableOfContentView,
} from './cell-markdown'
import {
    CellCodeState,
    cellCodeView,
    RunCodeActionView,
} from './cell-javascript'

export class CellsSeparatorView {
    public readonly class = 'd-flex w-100 align-items-center'
    public readonly children: VirtualDOM[]
    constructor(params: {
        state: AppState
        refCell: Immutable<NotebookCellTrait>
        position: 'before' | 'after'
    }) {
        this.children = [
            {
                class: 'fv-text-primary fas fa-plus-square fv-pointer fv-hover-text-focus',
                onclick: () => {
                    params.state.newCell(params.refCell, params.position)
                },
            },
            {
                class: 'flex-grow-1 border mx-2',
                style: {
                    height: '0px',
                },
            },
        ]
    }
}

export class ScrollerActionsView {
    public readonly class = 'd-flex'
    public readonly children: VirtualDOM[]
    constructor(params: { element: HTMLElement }) {
        this.children = [
            {
                class: 'fas fa-angle-double-up fv-pointer fv-hover-text-focus',
                onclick: () => {
                    params.element.scroll({
                        top: 0,
                        behavior: 'smooth',
                    })
                },
            },
            { class: 'mx-1' },
            {
                class: 'fas fa-angle-double-down fv-pointer fv-hover-text-focus',
                onclick: () => {
                    params.element.scroll({
                        top: params.element.scrollHeight,
                        behavior: 'smooth',
                    })
                },
            },
            { class: 'mx-1' },
        ]
    }
}
/**
 * @category View
 */
export class ReplTab extends DockableTabs.Tab {
    public readonly selectedCell$ = new BehaviorSubject<
        Immutable<NotebookCellTrait>
    >(undefined)
    constructor({ state }: { state: AppState }) {
        const scrollableElement$ = new Subject<HTMLElement>()
        const markdownUpdate$ = new ReplaySubject<boolean>(1)
        super({
            id: 'REPL',
            title: 'REPL',
            icon: 'fas fa-code',
            content: () => {
                return {
                    class: 'w-100 mx-auto d-flex flex-column',
                    style: {
                        height: '50vh',
                    },
                    onclick: () => this.selectedCell$.next(undefined),
                    children: [
                        {
                            class: 'w-100 d-flex justify-content-center py-1 border-bottom align-items-center',
                            children: [
                                {
                                    class: 'flex-grow-1',
                                },
                                new RunCodeActionView({
                                    onExe: () => state.execute(),
                                }),
                                {
                                    class: 'flex-grow-1',
                                },
                                child$(
                                    scrollableElement$,
                                    (element) =>
                                        new ScrollerActionsView({ element }),
                                ),
                            ],
                        },
                        {
                            class: 'd-flex flex-grow-1 w-100',
                            style: {
                                minHeight: '0px',
                            },
                            children: [
                                {
                                    class: 'w-25 h-100',
                                    children: [
                                        new TableOfContentView({
                                            markdownUpdate$,
                                        }),
                                    ],
                                },
                                {
                                    style: {
                                        minHeight: '0px',
                                        maxWidth: '800px',
                                        textAlign: 'justify',
                                    },
                                    class: 'h-100 w-75 px-4 d-flex flex-column mx-auto  overflow-auto',
                                    connectedCallback: (d: HTMLElement) => {
                                        d.scroll({ top: 0 })
                                        scrollableElement$.next(d)
                                    },
                                    children: childrenFromStore$(
                                        asMutable<
                                            Observable<NotebookCellTrait[]>
                                        >(state.cells$),
                                        (cellState) => {
                                            const preCellView =
                                                new CellsSeparatorView({
                                                    state,
                                                    refCell: cellState,
                                                    position: 'before',
                                                })
                                            const maybePostCellView =
                                                new CellsSeparatorView({
                                                    state,
                                                    refCell: cellState,
                                                    position: 'after',
                                                })
                                            const postCellView = child$(
                                                state.cells$,
                                                (cells) => {
                                                    const lastCell =
                                                        cells.slice(-1)[0]
                                                    return lastCell == cellState
                                                        ? maybePostCellView
                                                        : {}
                                                },
                                            )
                                            const content =
                                                cellState.mode == 'code'
                                                    ? cellCodeView(
                                                          state,
                                                          cellState as CellCodeState,
                                                          this.selectedCell$,
                                                      )
                                                    : cellMarkdownView(
                                                          state,
                                                          cellState,
                                                          this.selectedCell$,
                                                          markdownUpdate$,
                                                      )
                                            return {
                                                children: [
                                                    preCellView,
                                                    content,
                                                    postCellView,
                                                ],
                                            }
                                        },
                                        {
                                            orderOperator: (a, b) =>
                                                state.cells$.value.indexOf(a) -
                                                state.cells$.value.indexOf(b),
                                        },
                                    ),
                                },
                            ],
                        },
                    ],
                }
            },
        })
    }
}

export interface NotebookCellTrait extends Projects.CellTrait {
    mode: 'code' | 'markdown'

    execute: (
        p: Immutable<Projects.ProjectState>,
    ) => Promise<Immutable<Projects.ProjectState>>

    ideState: Common.IdeState
}

export function factoryCellState(
    mode: 'markdown' | 'code',
    appState: AppState,
    content: string,
) {
    return mode == 'markdown'
        ? new CellMarkdownState({
              appState,
              content,
          })
        : new CellCodeState({
              appState,
              content,
          })
}
