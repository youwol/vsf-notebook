import { AppState } from '../../../app.state'
import {
    BehaviorSubject,
    combineLatest,
    Observable,
    ReplaySubject,
    Subject,
} from 'rxjs'
import { Configurations, Immutable, Projects } from '@youwol/vsf-core'
import { attr$, childrenFromStore$, VirtualDOM } from '@youwol/flux-view'
import { CellWrapperView } from './cell.view'
import { NotebookCellTrait } from './repl.tab'
import { Common } from '@youwol/fv-code-mirror-editors'
import { map, scan, skip } from 'rxjs/operators'

export function cellCodeView(
    state: AppState,
    cellState: CellCodeState,
    selectedCell$: Subject<Immutable<NotebookCellTrait>>,
) {
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
