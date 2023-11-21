import { AppState } from '../../../app.state'
import {
    BehaviorSubject,
    combineLatest,
    Observable,
    ReplaySubject,
    Subject,
} from 'rxjs'
import { Configurations, Immutable, Projects } from '@youwol/vsf-core'
import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { CellWrapperView } from './cell.view'
import { NotebookCellTrait } from './notebook.tab'
import { Common } from '@youwol/rx-code-mirror-editors'
import { map, scan, skip } from 'rxjs/operators'

export function cellCodeView(
    state: AppState,
    cellState: CellCodeState,
    selectedCell$: Subject<Immutable<NotebookCellTrait>>,
) {
    const child = (ideView) => ({
        style: {
            source$: state.projectByCells$,
            vdomMap: (
                hist: Immutable<Map<NotebookCellTrait, Projects.ProjectState>>,
            ) => {
                return hist.has(cellState)
                    ? {
                          opacity: 1,
                          borderWidth: '5px',
                      }
                    : {
                          opacity: 0.5,
                      }
            },
        },
        class: {
            source: cellState.isLastCell$,
            vdomMap: (isLast: boolean): string =>
                isLast ? 'fv-border-left-success border-3' : 'w-100 h-100',
            wrapper: (d: string) => `${d} w-100 h-100`,
        },
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
        selectedCell$,
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
    public readonly output$ = new ReplaySubject<AnyVirtualDOM | 'clear'>()

    /**
     * @group Observables
     */
    public readonly outputs$ = new Observable<AnyVirtualDOM[]>()

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
 * @category View
 */
export class ReplOutput implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

    constructor(params: { cellState: CellCodeState }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'pre',
                class: 'w-100 fv-text-primary',
                style: {
                    marginBottom: '0px',
                },
                children: {
                    policy: 'sync',
                    source$: this.cellState.outputs$.pipe(map((vDom) => vDom)),
                    vdomMap: (vDom: AnyVirtualDOM) => vDom,
                },
            },
        ]
    }
}

export class RunCodeActionView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'fv-hover-bg-secondary'
    public readonly children: ChildrenLike
    public readonly onclick: () => void
    constructor(params: { onExe }) {
        const isRunning$ = new BehaviorSubject(false)
        this.children = [
            {
                tag: 'div',
                class: {
                    source$: isRunning$,
                    vdomMap: (isRunning): string =>
                        isRunning
                            ? 'fa-spinner fa-spin'
                            : 'fa-play fv-pointer fv-text-success',
                    wrapper: (d) => `${d} fas rounded p-1`,
                },
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
