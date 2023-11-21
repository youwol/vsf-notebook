import { AppState } from '../../../app.state'
import {
    VirtualDOM,
    RxAttribute,
    ChildrenLike,
    AnyVirtualDOM,
} from '@youwol/rx-vdom'
import { Immutable, Immutables } from '@youwol/vsf-core'
import { Subject } from 'rxjs'
import { Common } from '@youwol/rx-code-mirror-editors'
import { NotebookCellTrait } from './notebook.tab'
import { CellCodeState } from './cell-javascript'

export class CellWrapperView implements VirtualDOM<'div'> {
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
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: RxAttribute<Immutable<NotebookCellTrait>, string>

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    public readonly selectedCell$: Subject<Immutable<NotebookCellTrait>>

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
        withActions: AnyVirtualDOM[]
        selectedCell$: Subject<Immutable<NotebookCellTrait>>
        onExe
        language
        child
    }) {
        Object.assign(this, params)
        this.class = {
            source$: this.selectedCell$,
            vdomMap: (selected): string =>
                selected === this.cellState ? 'fv-border-focus' : '',
            wrapper: (d) => `w-100 p-1 ${d}`,
        }
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
            {
                source$: this.selectedCell$,
                vdomMap: (cellState) => {
                    return cellState == this.cellState
                        ? new ReplTopMenuView({
                              withActions: params.withActions,
                              cellState: this.cellState,
                              appState: this.appState,
                          })
                        : { innerHTML: '&#8205; ' }
                },
            },
            params.child(ideView),
        ]
        this.onclick = (ev) => {
            this.selectedCell$.next(this.cellState)
            this.appState.selectCell(this.cellState)
            ev.stopPropagation()
        }
    }
}

/**
 * @category View
 */
export class MoveIconView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: RxAttribute<Immutables<NotebookCellTrait>, string>
    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick: () => void

    constructor(params: {
        direction: 'up' | 'down'
        appState: Immutable<AppState>
        cell: Immutable<NotebookCellTrait>
    }) {
        const isOk = (cells) => {
            const index = cells.indexOf(params.cell)
            return params.direction == 'up'
                ? index > 0
                : index < cells.length - 1
        }
        const faClass =
            params.direction == 'down'
                ? 'fa-arrow-alt-circle-down'
                : 'fa-arrow-alt-circle-up'
        this.class = {
            source$: params.appState.cells$,
            vdomMap: (cells): string => (isOk(cells) ? '' : 'd-none'),
            wrapper: (d) =>
                `${d} fas ${faClass} fv-hover-text-focus fv-pointer`,
        }
        this.onclick = () =>
            params.appState.moveCell(
                params.cell,
                params.direction == 'up' ? -1 : 1,
            )
    }
}

/**
 * @category View
 */
export class ReplTopMenuView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    constructor(params: {
        cellState: NotebookCellTrait
        appState: AppState
        withActions: AnyVirtualDOM[]
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
                        ev.target['value'],
                    )
                },
            },
            { tag: 'div', class: 'mx-2' },
            ...params.withActions,
            { tag: 'div', class: 'flex-grow-1' },
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    new MoveIconView({
                        appState: this.appState,
                        cell: this.cellState,
                        direction: 'up',
                    }),
                    { tag: 'div', class: 'mx-1' },
                    new MoveIconView({
                        appState: this.appState,
                        cell: this.cellState,
                        direction: 'down',
                    }),
                ],
            },
            { tag: 'div', class: 'mx-5' },
            {
                tag: 'div',
                class: classIcon,
                children: [
                    {
                        tag: 'div',
                        class: 'fas fa-trash fv-text-error fv-hover-text-focus',
                    },
                ],
                onclick: () => this.appState.deleteCell(this.cellState),
            },
        ]
    }
}
