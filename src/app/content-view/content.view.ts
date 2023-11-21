import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

import { ProjectNode } from '../side-nav-tabs'

import { AppState, TabCategory, TabIdentifier } from '../app.state'
import { Projects } from '@youwol/vsf-core'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { WorkflowTab } from './workflow.tab'
import { filter, map, take } from 'rxjs/operators'
import { ViewTab } from './view.view'
import { combineLatest } from 'rxjs'
import { DocumentationTab } from './documentation.view'

function viewFactory(nodeId: TabIdentifier, state: AppState) {
    if (nodeId.category == 'Workflow') {
        return new WorkflowTab({
            state,
            workflowId: nodeId.id,
        })
    }
    const source$ = combineLatest([
        state.project$,
        state.projectExplorerState$,
    ]).pipe(
        map(([project, explorer]) => ({
            node: explorer.getNode(nodeId.id),
            project,
        })),
        filter(({ node }) => node != undefined),
    )

    if (nodeId.category == 'View') {
        return {
            source$,
            vdomMap: ({ project, node }) => {
                return new ViewTab({
                    project,
                    state,
                    node,
                })
            },
        }
    }
    if (nodeId.category == 'Toolbox' || nodeId.category == 'Module') {
        return {
            source$,
            vdomMap: ({ node }) => {
                return new DocumentationTab({
                    node,
                })
            },
        }
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
     * @group States
     */
    public readonly state: AppState

    /**
     * @group States
     */
    public readonly project: Projects.ProjectState

    /**
     * @group States
     */
    public readonly explorer: ImmutableTree.State<ProjectNode>

    /**
     * @group Immutable DOM constants
     */
    public readonly class =
        'main-content-view w-100 h-100 d-flex flex-column fv-bg-background'

    /**
     * @group Immutable DOM constants
     */
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = [
            new FilesHeaderView({ appState: this.state }),
            {
                tag: 'div',
                class: 'w-100 flex-grow-1',
                style: {
                    minHeight: '0px',
                },
                children: {
                    policy: 'sync',
                    source$: this.state.openTabs$,
                    vdomMap: (nodeId: TabIdentifier) => {
                        const view = viewFactory(nodeId, this.state)
                        return {
                            tag: 'div' as const,
                            class: {
                                source$: this.state.selectedTab$,
                                vdomMap: (selected: TabIdentifier) =>
                                    selected && selected.id == nodeId.id
                                        ? 'w-100 h-100'
                                        : 'd-none',
                            },
                            children: [view],
                        }
                    },
                    comparisonOperator: (
                        e0: TabIdentifier,
                        e1: TabIdentifier,
                    ) => e0.id == e1.id,
                },
            },
        ]
    }
}

const icons: Record<TabCategory, string> = {
    Workflow: 'fas fa-sitemap',
    View: 'fas fa-eye',
    Toolbox: 'fas fa-boxes',
    Module: 'fas fa-box',
}
export class FilesHeaderView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group Immutable DOM constants
     */
    public readonly class: string = 'd-flex align-items-center w-100'

    /**
     * @group Immutable DOM constants
     */
    public readonly children: ChildrenLike

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.children = {
            policy: 'replace',
            source$: this.appState.openTabs$,
            vdomMap: (tabs: TabIdentifier[]) => {
                return tabs.map((tabId) => {
                    return {
                        tag: 'div',
                        style: {
                            fontSize: 'smaller',
                        },
                        class: {
                            source$: this.appState.selectedTab$,
                            vdomMap: (selected: TabIdentifier): string =>
                                selected && selected.id == tabId.id
                                    ? 'fv-text-focus fv-bg-background-alt'
                                    : 'fv-text-primary fv-bg-background',
                            wrapper: (d) =>
                                `${d} px-1 fv-border-bottom-background d-flex align-items-center px-2 fv-pointer fv-hover-xx-lighter`,
                        },
                        children: [
                            {
                                tag: 'div',
                                style: { transform: 'scale(0.8)' },
                                class: icons[tabId.category],
                            },
                            { tag: 'div', class: 'mx-1' },
                            {
                                tag: 'div',
                                innerText: tabId.name,
                            },
                            { tag: 'div', class: 'mx-1' },
                            {
                                tag: 'div',
                                style: { transform: 'scale(0.8)' },
                                class: 'fas fa-times fv-text-disabled rounded-circle p-1 fv-hover-text-error',
                                onclick: (ev: MouseEvent) => {
                                    this.appState.closeTab(tabId)
                                    ev.stopPropagation()
                                },
                            },
                        ],
                        onclick: () => {
                            combineLatest([
                                this.appState.projectExplorerState$,
                                this.appState.envExplorerState$.toolboxes,
                            ])
                                .pipe(take(1))
                                .subscribe(([project, env]) => {
                                    const node =
                                        project.getNode(tabId.id) ||
                                        env.getNode(tabId.id)
                                    this.appState.openTab(node)
                                })
                        },
                    }
                })
            },
        }
    }
}
