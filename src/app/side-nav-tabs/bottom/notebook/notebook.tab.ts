import { DockableTabs } from '@youwol/rx-tab-views'
import { Common } from '@youwol/rx-code-mirror-editors'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState } from '../../../app.state'
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'
import { Projects, Immutable, asMutable, Immutables } from '@youwol/vsf-core'
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

export class CellsSeparatorView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex w-100 align-items-center'
    public readonly children: ChildrenLike
    constructor(params: {
        state: AppState
        refCell: Immutable<NotebookCellTrait>
        position: 'before' | 'after'
    }) {
        this.children = [
            {
                tag: 'div',
                class: 'fv-text-primary fas fa-plus-square fv-pointer fv-hover-text-focus',
                onclick: () => {
                    params.state.newCell(params.refCell, params.position)
                },
            },
            {
                tag: 'div',
                class: 'flex-grow-1 border mx-2',
                style: {
                    height: '0px',
                },
            },
        ]
    }
}

export class ScrollerActionsView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex'
    public readonly children: ChildrenLike
    constructor(params: { element: HTMLElement }) {
        this.children = [
            {
                tag: 'div',
                class: 'fas fa-angle-double-up fv-pointer fv-hover-text-focus',
                onclick: () => {
                    params.element.scroll({
                        top: 0,
                        behavior: 'smooth',
                    })
                },
            },
            {
                tag: 'div',
                class: 'mx-1',
            },
            {
                tag: 'div',
                class: 'fas fa-angle-double-down fv-pointer fv-hover-text-focus',
                onclick: () => {
                    params.element.scroll({
                        top: params.element.scrollHeight,
                        behavior: 'smooth',
                    })
                },
            },
            {
                tag: 'div',
                class: 'mx-1',
            },
        ]
    }
}
/**
 * @category View
 */
export class NotebookTab extends DockableTabs.Tab {
    public readonly selectedCell$ = new BehaviorSubject<
        Immutable<NotebookCellTrait>
    >(undefined)
    constructor({ state }: { state: AppState }) {
        const scrollableElement$ = new Subject<HTMLElement>()
        const markdownUpdate$ = new ReplaySubject<boolean>(1)
        state.cells$.subscribe(() => markdownUpdate$.next(true))
        super({
            id: 'Notebook',
            title: 'Notebook',
            icon: 'fas fa-code',
            content: () => {
                return {
                    tag: 'div',
                    class: 'w-100 mx-auto d-flex flex-column',
                    style: {
                        height: '50vh',
                    },
                    onclick: () => this.selectedCell$.next(undefined),
                    children: [
                        {
                            tag: 'div',
                            class: 'w-100 d-flex justify-content-center py-1 border-bottom align-items-center',
                            children: [
                                {
                                    tag: 'div',
                                    class: 'flex-grow-1',
                                },
                                new RunCodeActionView({
                                    onExe: () => state.execute(),
                                }),
                                {
                                    tag: 'div',
                                    class: 'flex-grow-1',
                                },
                                {
                                    source$: scrollableElement$,
                                    vdomMap: (element: HTMLElement) =>
                                        new ScrollerActionsView({ element }),
                                },
                            ],
                        },
                        {
                            tag: 'div',
                            class: 'd-flex flex-grow-1 w-100',
                            style: {
                                minHeight: '0px',
                            },
                            children: [
                                {
                                    tag: 'div',
                                    class: 'w-25 h-100',
                                    children: [
                                        new TableOfContentView({
                                            markdownUpdate$,
                                            scrollableElement$,
                                        }),
                                    ],
                                },
                                {
                                    tag: 'div',
                                    class: 'h-100 flex-grow-1 overflow-auto',
                                    connectedCallback: (d: HTMLElement) => {
                                        d.scroll({ top: 0 })
                                        scrollableElement$.next(d)
                                    },
                                    children: [
                                        {
                                            tag: 'div',
                                            style: {
                                                minHeight: '0px',
                                                maxWidth: '800px',
                                                textAlign: 'justify',
                                            },
                                            class: 'h-100 w-75 px-4 d-flex flex-column mx-auto',
                                            children: {
                                                policy: 'sync' as const,
                                                source$: asMutable<
                                                    Observable<
                                                        NotebookCellTrait[]
                                                    >
                                                >(state.cells$),
                                                vdomMap: (
                                                    cellState: NotebookCellTrait,
                                                ) => {
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
                                                    const postCellView = {
                                                        source$: state.cells$,
                                                        vdomMap: (
                                                            cells: Immutables<NotebookCellTrait>,
                                                        ) => {
                                                            const lastCell =
                                                                cells.slice(
                                                                    -1,
                                                                )[0]
                                                            return lastCell ==
                                                                cellState
                                                                ? maybePostCellView
                                                                : {
                                                                      tag: 'div' as const,
                                                                  }
                                                        },
                                                    }
                                                    const content =
                                                        cellState.mode == 'code'
                                                            ? cellCodeView(
                                                                  state,
                                                                  cellState as CellCodeState,
                                                                  this
                                                                      .selectedCell$,
                                                              )
                                                            : cellMarkdownView(
                                                                  state,
                                                                  cellState,
                                                                  this
                                                                      .selectedCell$,
                                                                  markdownUpdate$,
                                                              )
                                                    return {
                                                        tag: 'div',
                                                        children: [
                                                            preCellView,
                                                            content,
                                                            postCellView,
                                                        ],
                                                    }
                                                },
                                                orderOperator: (
                                                    a: Immutable<NotebookCellTrait>,
                                                    b: Immutable<NotebookCellTrait>,
                                                ) =>
                                                    state.cells$.value.indexOf(
                                                        a,
                                                    ) -
                                                    state.cells$.value.indexOf(
                                                        b,
                                                    ),
                                            },
                                        },
                                    ],
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
