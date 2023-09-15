import { DockableTabs } from '@youwol/fv-tabs'
import { Common } from '@youwol/fv-code-mirror-editors'
import {
    attr$,
    child$,
    childrenFromStore$,
    VirtualDOM,
} from '@youwol/flux-view'
import { AppState } from '../../app.state'
import { delay, filter, map, mergeMap, scan, skip, take } from 'rxjs/operators'
import {
    BehaviorSubject,
    combineLatest,
    Observable,
    ReplaySubject,
    Subject,
} from 'rxjs'
import {
    Projects,
    Configurations,
    Immutable,
    asMutable,
} from '@youwol/vsf-core'

function cellCodeView(state: AppState, cellState: CellCodeState) {
    const child = (ideView) => ({
        style: attr$(state.projectByCells$, (hist) => {
            return hist.has(cellState)
                ? {
                      opacity: 1,
                      borderWidth: '5px',
                  }
                : {
                      opacity: 0.5,
                  }
        }),
        class: attr$(
            cellState.isLastCell$,
            (isLast): string =>
                isLast ? 'fv-border-left-success border-3' : 'w-100 h-100',
            { wrapper: (d) => `${d} w-100 h-100` },
        ),
        children: [
            ideView,
            new ReplOutput({
                cellState: cellState,
            }),
        ],
    })
    return new CellWrapperView({
        cellState,
        onExe: () => {
            state.execute(cellState).then()
        },
        withActions: [
            new RunCodeActionView({ onExe: () => state.execute(cellState) }),
        ],
        language: 'javascript',
        child,
    })
}

export function cellMarkdownView(
    state: AppState,
    cellState: NotebookCellTrait,
) {
    const editionMode$ = new BehaviorSubject<'view' | 'edit'>('view')
    const child = (ideView: Common.CodeEditorView) => {
        editionMode$
            .pipe(
                filter((m) => m == 'edit'),
                take(1),
                delay(100),
                mergeMap(() => ideView.nativeEditor$),
            )
            .subscribe((editor) => editor.refresh())
        const editMdView = {
            class: attr$(editionMode$, (mode) =>
                mode == 'view' ? 'd-none' : '',
            ),
            children: [ideView],
        }
        const readMdView = {
            class: attr$(editionMode$, (mode) =>
                mode == 'edit' ? 'd-none' : 'md-reader',
            ),
            innerHTML: attr$(cellState.ideState.updates$['./repl'], (file) =>
                window['marked'].parse(file.content),
            ),
            ondblclick: () => {
                editionMode$.next('edit')
            },
        }
        return {
            children: [editMdView, readMdView],
        }
    }
    const onExe = () => {
        const mode = editionMode$.value == 'view' ? 'edit' : 'view'
        editionMode$.next(mode)
    }
    return new CellWrapperView({
        cellState,
        onExe,
        withActions: [new MarkdownActionView({ onExe, editionMode$ })],
        language: 'markdown',
        child,
    })
}

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
    constructor({ state }: { state: AppState }) {
        const scrollableElement$ = new Subject<HTMLElement>()
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
                            class: 'flex-grow-1 w-100 overflow-auto',
                            connectedCallback: (d: HTMLElement) => {
                                d.scroll({ top: 0 })
                                scrollableElement$.next(d)
                            },
                            children: [
                                {
                                    style: {
                                        minHeight: '0px',
                                        maxWidth: '800px',
                                        textAlign: 'justify',
                                    },
                                    class: 'h-100 w-75  mx-auto',
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
                                                      )
                                                    : cellMarkdownView(
                                                          state,
                                                          cellState,
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

/**
 * @category State
 */
export class CellCodeState implements NotebookCellTrait {
    /**
     * @group ImmutableConstant
     */
    public readonly mode = 'code'

    /**
     * @group States
     */
    public readonly ideState: Common.IdeState

    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group Observables
     */
    public readonly isLastCell$: Observable<boolean>

    /**
     * @group Observables
     */
    public readonly output$ = new ReplaySubject<VirtualDOM | 'clear'>()

    /**
     * @group Observables
     */
    public readonly outputs$ = new Observable<VirtualDOM[]>()

    constructor(params: { appState: AppState; content: string }) {
        Object.assign(this, params)
        this.ideState = new Common.IdeState({
            files: [
                {
                    path: './repl',
                    content: params.content,
                },
            ],
            defaultFileSystem: Promise.resolve(new Map<string, string>()),
        })
        this.ideState.updates$['./repl'].pipe(skip(1)).subscribe(() => {
            this.appState.invalidateCell(this)
        })
        this.isLastCell$ = combineLatest([
            this.appState.cells$,
            this.appState.projectByCells$,
        ]).pipe(
            map(([cells, projectByCells]) => {
                const index = cells.indexOf(this)
                return projectByCells.has(cells[index + 1])
            }),
        )
        this.outputs$ = this.output$.pipe(
            scan((acc, e) => (e != 'clear' ? [...acc, e] : []), []),
        )
    }

    execute(
        project: Immutable<Projects.ProjectState>,
    ): Promise<Immutable<Projects.ProjectState>> {
        const attrCode = new Configurations.JsCode<Projects.CellFunction>({
            value: this.ideState.updates$['./repl'].value.content,
        })
        const executor = new Projects.JsCell({
            source: attrCode,
            viewsFactory: project.environment.viewsFactory,
        })
        this.output$.next('clear')
        executor.outputs$.subscribe((view) => {
            this.output$.next(view)
        })
        return executor.execute(project)
    }
}

/**
 * @category State
 */
export class CellMarkdownState implements NotebookCellTrait {
    /**
     * @group ImmutableConstant
     */
    public readonly mode = 'markdown'

    /**
     * @group States
     */
    public readonly ideState: Common.IdeState

    /**
     * @group States
     */
    public readonly appState: AppState

    constructor(params: { appState: AppState; content: string }) {
        Object.assign(this, params)
        this.ideState = new Common.IdeState({
            files: [
                {
                    path: './repl',
                    content: params.content,
                },
            ],
            defaultFileSystem: Promise.resolve(new Map<string, string>()),
        })
    }

    execute(
        project: Immutable<Projects.ProjectState>,
    ): Promise<Immutable<Projects.ProjectState>> {
        return Promise.resolve(project)
    }
}

export class CellWrapperView {
    /**
     * @group States
     */
    public readonly cellState: CellCodeState

    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 p-1 fv-hover-border-focus'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Observables
     */
    public readonly hovered$: BehaviorSubject<boolean> = new BehaviorSubject(
        false,
    )

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick: (ev: MouseEvent) => void

    /**
     * @group Immutable DOM Constants
     */
    public readonly onmouseenter: (ev: MouseEvent) => void

    /**
     * @group Immutable DOM Constants
     */
    public readonly onmouseleave: (ev: MouseEvent) => void

    constructor(params: {
        cellState: NotebookCellTrait
        withActions: VirtualDOM[]
        onExe
        language
        child
    }) {
        Object.assign(this, params)
        this.appState = this.cellState.appState
        const ideView = new Common.CodeEditorView({
            ideState: this.cellState.ideState,
            path: './repl',
            language: params.language,
            config: {
                extraKeys: {
                    'Ctrl-Enter': () => {
                        params.onExe()
                    },
                },
            },
        })
        this.children = [
            child$(this.hovered$, (hovered) => {
                return hovered
                    ? new ReplTopMenuView({
                          withActions: params.withActions,
                          cellState: this.cellState,
                          appState: this.appState,
                      })
                    : { innerHTML: '&#8205; ' }
            }),
            params.child(ideView),
        ]
        this.onclick = () => this.appState.selectCell(this.cellState)
        this.onmouseenter = () => this.hovered$.next(true)
        this.onmouseleave = () => this.hovered$.next(false)
    }
}

/**
 * @category View
 */
export class ReplOutput {
    /**
     * @group States
     */
    public readonly cellState: CellCodeState
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 p-1'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { cellState: CellCodeState }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'pre',
                class: 'w-100 fv-text-primary',
                style: {
                    marginBottom: '0px',
                },
                children: childrenFromStore$(
                    this.cellState.outputs$.pipe(map((vDom) => vDom)),
                    (vDom) => vDom,
                ),
            },
        ]
    }
}
/**
 * @category View
 */
export class ReplTopMenuView {
    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group States
     */
    public readonly cellState: NotebookCellTrait

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'w-100 d-flex align-items-center fv-bg-background-alt px-2'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: {
        cellState: NotebookCellTrait
        appState: AppState
        withActions: VirtualDOM[]
    }) {
        Object.assign(this, params)
        const classIcon =
            'd-flex align-items-center rounded p-1 fv-hover-text-focus fv-pointer'
        this.children = [
            {
                tag: 'select',
                children: [
                    {
                        tag: 'option',
                        innerText: 'code',
                        value: 'code',
                        selected: this.cellState.mode == 'code',
                    },
                    {
                        tag: 'option',
                        innerText: 'markdown',
                        value: 'markdown',
                        selected: this.cellState.mode == 'markdown',
                    },
                ],
                onchange: (ev) => {
                    this.appState.changeCellMode(
                        this.cellState,
                        ev.target.value,
                    )
                },
            },
            {
                class: 'mx-2',
            },
            ...params.withActions,
            { class: 'flex-grow-1' },
            { class: 'mx-2' },
            {
                class: classIcon,
                children: [
                    {
                        class: 'fas fa-trash fv-text-error fv-hover-text-focus',
                    },
                ],
                onclick: () => this.appState.deleteCell(this.cellState),
            },
        ]
    }
}

export class RunCodeActionView {
    public readonly class = 'fv-hover-bg-secondary'
    public readonly children: VirtualDOM[]
    public readonly onclick
    constructor(params: { onExe }) {
        const isRunning$ = new BehaviorSubject(false)
        this.children = [
            {
                class: attr$(
                    isRunning$,
                    (isRunning): string =>
                        isRunning
                            ? 'fa-spinner fa-spin'
                            : 'fa-play fv-pointer fv-text-success',
                    {
                        wrapper: (d) => `${d} fas rounded p-1`,
                    },
                ),
            },
        ]
        this.onclick = () => {
            isRunning$.next(true)
            params.onExe().then(() => {
                isRunning$.next(false)
            })
        }
    }
}

export class MarkdownActionView {
    public readonly class = 'fv-hover-text-focus'
    public readonly children: VirtualDOM[]
    public readonly onclick
    constructor(params: {
        onExe
        editionMode$: BehaviorSubject<'view' | 'edit'>
    }) {
        this.children = [
            {
                class: attr$(
                    params.editionMode$,
                    (mode): string => (mode == 'view' ? 'fa-pen' : 'fa-eye'),
                    {
                        wrapper: (d) =>
                            `${d} fv-text-success fas fv-pointer p-1`,
                    },
                ),
            },
        ]
        this.onclick = () => {
            params.onExe()
        }
    }
}
