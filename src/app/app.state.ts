import { DockableTabs } from '@youwol/rx-tab-views'
import {
    BehaviorSubject,
    combineLatest,
    from,
    Observable,
    of,
    ReplaySubject,
    Subject,
} from 'rxjs'
import { downloadZip } from 'client-zip'
import {
    ProjectTab,
    NotebookTab,
    EnvironmentTab,
    NodeProjectBase,
    ModuleInstance,
    createProjectRootNode,
    Workflow,
    View,
    CellCodeState,
    NotebookCellTrait,
    factoryCellState,
    NodeToolboxesBase,
    createEnvRootNode,
    createWorkersRootNode,
    NodeWorkersBase,
    ToolboxNode,
    ModuleNode,
    plugWorkersPoolUpdate,
    NodeLibrariesBase,
    createEnvLibRootNode,
} from './side-nav-tabs'

import { ImmutableTree } from '@youwol/rx-tree-views'
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    shareReplay,
    skipWhile,
    switchMap,
    take,
    tap,
} from 'rxjs/operators'
import { HttpModels } from '.'
import { AssetsGateway } from '@youwol/http-clients'
import { Selectable, StateTrait } from '@youwol/vsf-canvas'
import {
    HtmlTrait,
    Immutable,
    Immutables,
    Configurations,
    Deployers,
    Modules,
    Projects,
} from '@youwol/vsf-core'
import { viewsFactory } from './environments'
import { ViewsTab } from './side-nav-tabs/bottom/views'
import { JournalsTab } from './side-nav-tabs/bottom/journals'
import { DocumentationsTab } from './side-nav-tabs/bottom/documentations'
import { ConfigTab } from './side-nav-tabs/right/config'
import { WorkersPoolTypes } from '@youwol/webpm-client'
import { WorkersTab } from './side-nav-tabs/bottom/workers'

type ProjectByCells = Map<NotebookCellTrait, Immutable<Projects.ProjectState>>

export type TabCategory = 'Workflow' | 'View' | 'Toolbox' | 'Module'

function instanceOfTabCategory(category: string): category is TabCategory {
    return ['Workflow', 'View', 'Toolbox', 'Module'].includes(category)
}

export type TabIdentifier = {
    category: TabCategory
    id: string
    name: string
    isAlive: (project: Immutable<Projects.ProjectState>) => boolean
}

type ProjectByCellState = Map<
    NotebookCellTrait,
    Immutable<Projects.ProjectState>
>
/**
 * @category State
 * @category Entry Point
 */
export class AppState implements StateTrait {
    /**
     * @group Observable
     */
    public readonly project$: BehaviorSubject<Immutable<Projects.ProjectState>>

    /**
     * Immutable Constants
     */
    public readonly assetId: string

    /**
     * @group Observable
     */
    public readonly cells$ = new BehaviorSubject<Immutables<NotebookCellTrait>>(
        [],
    )

    /**
     @group Observable
     */
    public readonly projectByCells$: BehaviorSubject<
        Immutable<ProjectByCellState>
    > = new BehaviorSubject(
        new Map<NotebookCellTrait, Immutable<Projects.ProjectState>>(),
    )

    /**
     * @group MutableVariable
     * @private
     */
    public lastAvailableProject: Immutable<Projects.ProjectState>

    /**
     * @group States
     */
    public readonly bottomSideNavState: DockableTabs.State
    /**
     * @group States
     */
    public readonly leftSideNavState: DockableTabs.State
    /**
     * @group States
     */
    public readonly rightSideNavState: DockableTabs.State

    /**
     * @group Observable
     */
    public readonly selectedUid$ = new ReplaySubject<string>(1)

    /**
     * @group Observable
     */
    public readonly openTabs$ = new BehaviorSubject<TabIdentifier[]>([])

    /**
     * @group Observables
     */
    public readonly selectedTab$ = new BehaviorSubject<TabIdentifier>(undefined)

    /**
     *
     * @group States
     */
    public readonly projectExplorerState$: Observable<
        ImmutableTree.State<NodeProjectBase>
    >

    /**
     *
     * @group States
     */
    public readonly envExplorerState$: {
        toolboxes: Observable<ImmutableTree.State<NodeToolboxesBase>>
        libraries: Observable<ImmutableTree.State<NodeLibrariesBase>>
        pools: Observable<ImmutableTree.State<NodeWorkersBase>>
    }

    /**
     * @group Immutable Properties
     */
    public readonly emptyProject: Immutable<Projects.ProjectState>

    /**
     *
     * @group Observables
     */
    public readonly selectedConfigurable$ = new Subject<
        Immutable<Modules.ImplementationTrait>
    >()

    /**
     *
     * @group Observables
     */
    public readonly selectedModulesView$ = new BehaviorSubject<
        Immutable<Modules.ImplementationTrait[]>
    >([])

    /**
     *
     * @group Observables
     */
    public readonly selectedModulesJournal$ = new BehaviorSubject<
        Immutable<Modules.ImplementationTrait[]>
    >([])

    /**
     *
     * @group Observables
     */
    public readonly selectedModulesDocumentation$ = new BehaviorSubject<
        Immutable<Modules.ImplementationTrait[]>
    >([])

    /**
     *
     * @group Observables
     */
    public readonly selectedWorkers$ = new BehaviorSubject<
        Immutable<
            { workersPool: WorkersPoolTypes.WorkersPool; workerId: string }[]
        >
    >([])

    private lastExecutedProject: Immutable<Projects.ProjectState>

    constructor(params: {
        assetId: string
        originalReplSource: HttpModels.ReplSource
    }) {
        Object.assign(this, params)
        const assetsGtwClient = new AssetsGateway.Client()
        // Because of Immutable<_, 'deep'>: TS2589: Type instantiation is excessively deep and possibly infinite
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TS2589
        // @ts-ignore
        this.emptyProject = new Projects.ProjectState({
            environment: new Projects.Environment({
                viewsFactory,
            }),
        })

        this.lastAvailableProject = this.emptyProject
        this.project$ = new BehaviorSubject(this.emptyProject)
        let prev = undefined
        const history = new Map()
        this.cells$.next(
            params.originalReplSource.cells.map((c, i) => {
                const cell = factoryCellState(c.mode, this, c.content)
                if (i == 0) {
                    history.set(cell, this.emptyProject)
                }
                if (i > 0 && prev && history.get(prev)) {
                    history.set(cell, history.get(prev))
                }
                if (c.mode == 'markdown') {
                    prev = cell
                } else {
                    prev = undefined
                }
                return cell
            }),
        )
        this.projectByCells$.next(history)
        this.cells$
            .pipe(
                switchMap((cells) =>
                    combineLatest(
                        cells.map((cell) =>
                            cell.ideState.updates$['./repl'].pipe(
                                map((file) => ({
                                    mode: cell.mode,
                                    content: file.content,
                                })),
                            ),
                        ),
                    ),
                ),
                debounceTime(2000),
                mergeMap((cells) => {
                    const source = {
                        name: 'source.json',
                        lastModified: new Date(),
                        input: JSON.stringify({ cells }),
                    }
                    return from(downloadZip([source]).blob())
                }),
                mergeMap((blob) => {
                    return assetsGtwClient.assets.addZipFiles$({
                        assetId: this.assetId,
                        body: { content: blob },
                    })
                }),
            )
            .subscribe((v) => {
                console.log('Saved', v)
            })
        this.projectExplorerState$ = toExplorer$({
            appState: this,
            project$: this.project$,
            expandedNodes: (rootNode) => [rootNode.id, rootNode.children[0].id],
            selectedNode: (rootNode) => rootNode.children[0],
            actionDispatch: (node) => {
                if (node instanceof ModuleInstance) {
                    this.selectedUid$.next(node.id)
                }
                if (node instanceof Workflow || node instanceof View) {
                    this.openTab(node)
                }
            },
            nodeFactory: createProjectRootNode,
        })
        this.envExplorerState$ = {
            toolboxes: toExplorer$({
                appState: this,
                project$: this.project$,
                expandedNodes: (rootNode) => [rootNode.id],
                actionDispatch: (node) => {
                    if (
                        node instanceof ToolboxNode ||
                        node instanceof ModuleNode
                    ) {
                        this.openTab(node)
                    }
                },
                nodeFactory: createEnvRootNode,
            }),
            libraries: toExplorer$({
                appState: this,
                project$: this.project$,
                expandedNodes: (rootNode) => [rootNode.id],
                actionDispatch: () => {
                    // No op
                },
                nodeFactory: createEnvLibRootNode,
            }),
            pools: toExplorer$({
                appState: this,
                project$: this.project$,
                expandedNodes: (rootNode) => [rootNode.id],
                actionDispatch: () => {
                    // No op
                },
                nodeFactory: createWorkersRootNode,
                onCreated: plugWorkersPoolUpdate,
            }),
        }
        combineLatest([
            this.projectExplorerState$,
            this.envExplorerState$.toolboxes,
        ]).subscribe((explorers: ImmutableTree.State<ImmutableTree.Node>[]) => {
            this.openTabs$.value
                .filter((tab) => {
                    return explorers
                        .map((explorer) => explorer.getNode(tab.id))
                        .every((n) => n == undefined)
                })
                .forEach((tab) => this.closeTab(tab))
        })
        combineLatest([
            this.selectedUid$.pipe(distinctUntilChanged()),
            this.projectExplorerState$,
        ]).subscribe(([uid, explorer]) => {
            explorer.selectedNode$.next(explorer.getNode(uid))
        })

        this.bottomSideNavState = new DockableTabs.State({
            disposition: 'bottom',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([
                new NotebookTab({ state: this }),
                new ViewsTab({ state: this }),
                new JournalsTab({ state: this }),
                new DocumentationsTab({ state: this }),
                new WorkersTab({ state: this }),
            ]),
            selected$: new BehaviorSubject<string>('Notebook'),
            persistTabsView: true,
        })
        this.leftSideNavState = new DockableTabs.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([
                new ProjectTab({ state: this }),
                new EnvironmentTab({ state: this }),
            ]),
            selected$: new BehaviorSubject<string>('Project'),
        })
        this.rightSideNavState = new DockableTabs.State({
            disposition: 'right',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>(
                'collapsed',
            ),
            tabs$: new BehaviorSubject([new ConfigTab({ state: this })]),
            selected$: new BehaviorSubject<string>('Config.'),
            persistTabsView: true,
        })

        if (params.originalReplSource.cells.length == 0) {
            this.newCell(undefined, 'before')
        }
    }

    async execute(cell?: Immutable<NotebookCellTrait>): Promise<{
        history: Immutable<ProjectByCells>
        project: Projects.ProjectState
    }> {
        cell = cell || this.cells$.value.slice(-1)[0]
        const index = this.cells$.value.indexOf(cell)
        const executingCells = this.cells$.value.slice(0, index + 1)
        const remainingCells = this.cells$.value.slice(index + 1)

        const batch = new Projects.BatchCells({
            cells: executingCells,
            projectsStore$: this.projectByCells$,
        })
        return batch.execute(this.emptyProject).then((project) => {
            const newHistory = new Map(this.projectByCells$.value)
            if (remainingCells.length > 0 && this.lastExecutedProject) {
                this.lastExecutedProject.instancePool.stop({
                    keepAlive: project.instancePool,
                })
            }
            remainingCells.forEach((cell) => {
                newHistory.delete(cell)
            })
            if (index < this.cells$.value.length - 1) {
                newHistory.set(this.cells$.value[index + 1], project)
            }
            this.project$.next(project)
            this.projectByCells$.next(newHistory)
            this.lastExecutedProject = project
            this.closeOutdatedTabs(project)
            return {
                history: this.projectByCells$.value,
                project,
            }
        })
    }

    openTab(node: NodeProjectBase | NodeToolboxesBase) {
        if (!instanceOfTabCategory(node.category)) {
            return
        }
        const opened = this.openTabs$.value
        let isAlive = (_: Immutable<Projects.ProjectState>) => true
        if (node.category === 'Workflow' || node.category === 'View') {
            isAlive = (project: Immutable<Projects.ProjectState>) => {
                if (node['parent'] === 'main') {
                    return true
                }
                if (node['parent'] === 'macro') {
                    return (
                        project.macros.find(({ uid }) => uid === node.id) !==
                        undefined
                    )
                }
                if (node['parent'] === 'worksheet') {
                    return (
                        project.runningWorksheets.find(
                            ({ uid }) => uid === node.id,
                        ) !== undefined
                    )
                }
            }
        }

        const nodeId = {
            id: node.id,
            category: node.category,
            name: node.name,
            isAlive,
        }
        if (!opened.find((n) => n.id == nodeId.id)) {
            this.openTabs$.next([...opened, nodeId])
        }
        this.selectedTab$.next(nodeId)
    }

    closeTab(node: TabIdentifier) {
        const opened = this.openTabs$.value.filter(({ id }) => id != node.id)
        if (opened.length != this.openTabs$.value.length) {
            this.openTabs$.next(opened)
        }
        if (this.selectedTab$.value.id == node.id) {
            this.selectedTab$.next(opened[0])
        }
    }

    newCell(cellRef: Immutable<NotebookCellTrait>, where: 'after' | 'before') {
        const { newCells, newStore } = Projects.insertCell({
            cells: this.cells$.value,
            cellRef,
            newCell: new CellCodeState({
                appState: this,
                content:
                    'return async ({project, cell, env}) => {\n\treturn project\n}',
            }),
            where,
            store: this.projectByCells$.value,
            statePreserved: true,
        })
        this.projectByCells$.next(newStore)
        this.cells$.next(newCells)
    }

    deleteCell(cell?: NotebookCellTrait) {
        const cells = this.cells$.value
        const newCells = cells.filter((c) => c != cell)

        this.cells$.next(newCells)
        const projectByCells = this.projectByCells$.value
        if (projectByCells.has(cell)) {
            const newMaps = new Map(this.projectByCells$.value)
            newMaps.delete(cell)
            this.projectByCells$.next(newMaps)
        }
    }

    selectCell(cell: NotebookCellTrait) {
        const project = this.project$.value
        const runningWs = this.project$.value.runningWorksheets.map(
            ({ uid }) => uid,
        )
        this.closeOutdatedTabs(project.stopWorksheets(runningWs))
        const indexCell = this.cells$.value.indexOf(cell)
        const nextCell = this.cells$.value[indexCell + 1]
        const state = this.projectByCells$.value.get(nextCell)
        state && state != this.project$.value && this.project$.next(state)
    }

    changeCellMode(cell: NotebookCellTrait, mode: 'code' | 'markdown') {
        const newCell = factoryCellState(
            mode,
            this,
            cell.ideState.updates$['./repl'].value.content,
        )
        const newCells = this.cells$.value.map((c) => (c == cell ? newCell : c))
        this.cells$.next(newCells)
        const projectByCells = this.projectByCells$.value
        if (projectByCells.has(cell)) {
            const newMaps = new Map(this.projectByCells$.value)
            newMaps.set(newCell, newMaps.get(cell))
            newMaps.delete(cell)
            this.projectByCells$.next(newMaps)
        }
    }

    displayModuleView(
        module: Immutable<Modules.ImplementationTrait & HtmlTrait>,
    ) {
        this.bottomSideNavState.selected$.next('Views')
        const actualViews = this.selectedModulesView$.value
        this.selectedModulesView$.next([...actualViews, module])
    }

    closeModuleView(module: Immutable<Modules.ImplementationTrait>) {
        const actualViews = this.selectedModulesView$.value
        this.selectedModulesView$.next(actualViews.filter((m) => m != module))
    }

    displayModuleJournal(module: Immutable<Modules.ImplementationTrait>) {
        this.bottomSideNavState.selected$.next('Journals')
        const actualViews = this.selectedModulesJournal$.value
        this.selectedModulesJournal$.next([...actualViews, module])
    }

    closeModuleJournal(module: Immutable<Modules.ImplementationTrait>) {
        const actualViews = this.selectedModulesJournal$.value
        this.selectedModulesJournal$.next(
            actualViews.filter((m) => m != module),
        )
    }

    displayModuleDocumentation(module: Immutable<Modules.ImplementationTrait>) {
        this.bottomSideNavState.selected$.next('Documentations')
        const actualViews = this.selectedModulesDocumentation$.value
        this.selectedModulesDocumentation$.next([...actualViews, module])
    }

    closeModuleDocumentation(module: Immutable<Modules.ImplementationTrait>) {
        const actualViews = this.selectedModulesDocumentation$.value
        this.selectedModulesDocumentation$.next(
            actualViews.filter((m) => m != module),
        )
    }

    displayWorkerEnvironment(
        workerEnv: Immutable<Deployers.WorkerEnvironmentTrait>,
    ) {
        this.bottomSideNavState.selected$.next('Workers')
        const actualViews = this.selectedWorkers$.value
        this.selectedWorkers$.next([...actualViews, workerEnv])
    }

    closeWorkerEnvironment(workerEnv: Deployers.WorkerEnvironmentTrait) {
        const actualViews = this.selectedWorkers$.value
        this.selectedWorkers$.next(actualViews.filter((w) => w != workerEnv))
    }

    select(entities: Immutables<Selectable>) {
        if (
            entities.length == 1 &&
            Configurations.implementsConfigurableTrait(entities[0])
        ) {
            this.selectedConfigurable$.next(entities[0])
            this.rightSideNavState.viewState$.next('expanded')
            return
        }
        this.rightSideNavState.viewState$.next('collapsed')
    }

    moveCell(cell: Immutable<NotebookCellTrait>, deltaIndex: number) {
        const cells = [...this.cells$.value]
        const oldIndex = cells.indexOf(cell)
        if (
            oldIndex + deltaIndex >= cells.length ||
            oldIndex + deltaIndex < 0
        ) {
            console.error('Can not move cell at a requested position', {
                oldIndex,
                deltaIndex,
                cells,
            })
            return
        }
        cells.splice(oldIndex, 1)
        cells.splice(oldIndex + deltaIndex, 0, cell)
        this.cells$.next(cells)
        const newIndex = cells.indexOf(cell)
        // -1 because the cell itself is actually also invalidated
        this.invalidateCell(cells[newIndex - 1])
    }

    private closeOutdatedTabs(project: Immutable<Projects.ProjectState>) {
        const selections = [
            this.selectedModulesView$,
            this.selectedModulesJournal$,
            this.selectedModulesDocumentation$,
        ]
        const instancePools = [
            project.instancePool,
            ...project.runningWorksheets.map(
                ({ instancePool }) => instancePool,
            ),
        ]
        const modules = instancePools
            .map((instancePool) => instancePool.inspector().flat().modules)
            .flat()
        selections.forEach((selected$) => {
            const displayedModules = selected$.value
            const toKeep = displayedModules.filter(
                (m: Immutable<Modules.ImplementationTrait>) =>
                    modules.includes(m),
            )
            selected$.next(toKeep)
        })
        const tabsToClose = this.openTabs$.value.filter((tab) => {
            return !tab.isAlive(project)
        })
        tabsToClose.forEach((tab) => this.closeTab(tab))
    }

    invalidateCell(cell: Immutable<NotebookCellTrait>) {
        const cells = this.cells$.value
        const index = cells.indexOf(cell)
        const remainingCells = cells.slice(index + 1)
        const newHistory = new Map(this.projectByCells$.value)
        if (remainingCells.length > 0 && this.lastExecutedProject) {
            this.lastExecutedProject.instancePool.stop({
                keepAlive: this.project$.value.instancePool,
            })
        }
        remainingCells.forEach((cell) => {
            newHistory.delete(cell)
        })
        this.projectByCells$.next(newHistory)
    }

    async runWorksheet(name: string) {
        const project = await this.project$.value.runWorksheet(name)
        this.project$.value !== project && this.project$.next(project)
        this.projectExplorerState$
            .pipe(
                map((state) => ({ state, node: state.getNode(name) })),
                skipWhile((node) => node === undefined),
                mergeMap(({ state, node }) => {
                    const children$ = state.getChildren$(node)
                    state.getChildren(node)
                    return children$
                }),
                take(1),
            )
            .subscribe((children) => {
                this.openTab(children[0] as Workflow)
            })
    }
}

function toExplorer$<TNode extends ImmutableTree.Node>({
    appState,
    project$,
    actionDispatch,
    nodeFactory,
    expandedNodes,
    selectedNode,
    onCreated,
}: {
    appState: AppState
    project$: Observable<Immutable<Projects.ProjectState>>
    actionDispatch: (node) => void
    nodeFactory: (project: Projects.ProjectState, appState: AppState) => TNode
    expandedNodes: (rootNode: TNode) => string[]
    selectedNode?: (rootNode: TNode) => TNode
    onCreated?: ({
        explorer,
        project,
        rootNode,
    }: {
        explorer: ImmutableTree.State<TNode>
        project: Projects.ProjectState
        rootNode: TNode
    }) => Observable<unknown>
}) {
    const explorer$ = project$.pipe(
        filter((p) => p != undefined),
        map((project) => {
            const rootNode = nodeFactory(project, appState)
            const state = new ImmutableTree.State<TNode>({
                rootNode,
                expandedNodes: expandedNodes(rootNode),
            })
            return {
                explorer: state,
                project,
                rootNode,
            }
        }),
        switchMap((d) => (onCreated ? onCreated(d).pipe(map(() => d)) : of(d))),
        tap(({ explorer, rootNode }) => {
            selectedNode && explorer.selectedNode$.next(selectedNode(rootNode))
        }),
        map(({ explorer }) => explorer),
        shareReplay({ bufferSize: 1, refCount: true }),
    )
    explorer$
        .pipe(switchMap((explorerState) => explorerState.selectedNode$))
        .subscribe((node) => {
            actionDispatch(node)
        })
    return explorer$
}
