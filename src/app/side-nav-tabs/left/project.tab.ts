import { DockableTabs } from '@youwol/rx-tab-views'
import { VirtualDOM, ChildrenLike } from '@youwol/rx-vdom'
import { AppState } from '../../app.state'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { Immutable, Projects, Macros as MacroVsf } from '@youwol/vsf-core'
import { from, Observable, of } from 'rxjs'
import { map, mergeMap, take } from 'rxjs/operators'

/**
 * @category View
 */
export class ProjectTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Project',
            title: 'Project',
            icon: '',
            content: () => {
                return {
                    tag: 'div',
                    style: {
                        width: '300px',
                    },
                    children: [new ProjectView({ state })],
                }
            },
        })
    }
}

/**
 * @category View
 */
export class ProjectView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group States
     */
    public readonly state: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            {
                source$: this.state.projectExplorerState$,
                vdomMap: (state: ImmutableTree.State<NodeProjectBase>) => {
                    return new ImmutableTree.View({
                        state,
                        headerView: (state, node: NodeProjectBase) => {
                            return new NodeView({ state, node })
                        },
                    })
                },
            },
        ]
    }
}

type NodeProjectCategory =
    | 'Node'
    | 'Project'
    | 'ModuleInstance'
    | 'Layer'
    | 'Workflow'
    | 'Macros'
    | 'Api'
    | 'ApiIn'
    | 'ApiOut'
    | 'Views'
    | 'View'
    | 'Worksheets'
    | 'Worksheet'

/**
 * @category Nodes
 */
export abstract class NodeProjectBase extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */
    public readonly name: string

    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Node'

    protected constructor({
        id,
        name,
        children,
    }: {
        id: string
        name: string
        children?: NodeProjectBase[] | Observable<NodeProjectBase[]>
    }) {
        super({ id, children })
        this.name = name
    }
}

/**
 * @category Nodes
 */
export class ProjectNode extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Project'

    constructor(params: { id: string; name: string; children }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}
/**
 * @category Nodes
 */
export class ModuleInstance extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'ModuleInstance'

    constructor(params: { id: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Layer extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Layer'

    constructor(params: { id: string; name: string; children }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Workflow extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Workflow'

    /**
     * @group Immutable Constants
     */
    public readonly parent: 'main' | 'macro' | 'worksheet'

    constructor(params: {
        id: string
        name: string
        children: NodeProjectBase[]
        parent: 'main' | 'macro' | 'worksheet'
    }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Macros extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Macros'

    constructor(params: { id: string; name: string; children }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Api extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Api'

    constructor(params: { id: string; name: string; children }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class ApiIn extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'ApiIn'

    constructor(params: { id: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class ApiOut extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'ApiOut'

    constructor(params: { id: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Views extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Views'

    /**
     * @group Immutable Constants
     */
    public readonly parent: 'main' | 'macro' | 'worksheet'

    constructor(params: {
        id: string
        name: string
        children
        parent: 'main' | 'macro' | 'worksheet'
    }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Worksheets extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Worksheets'

    constructor(params: { id: string; name: string; children: Worksheet[] }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Worksheet extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Worksheet'

    constructor(params: {
        id: string
        name: string
        children: Observable<NodeProjectBase[]>
    }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class View extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'View'

    public readonly worksheet?: string

    constructor(params: { id: string; name: string; worksheet?: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

export function createLayerNode(parentId: string, layer) {
    return new Layer({
        id: `${parentId}.${layer.uid}`,
        name: layer.uid,
        children: [
            ...layer.moduleIds.map(
                (moduleId) =>
                    new ModuleInstance({
                        name: moduleId,
                        id: moduleId,
                    }),
            ),
            ...layer.children.map((l) => createLayerNode(layer.uid, l)),
        ],
    })
}
export function createProjectRootNode(
    project: Immutable<Projects.ProjectState>,
    appState: AppState,
) {
    return new ProjectNode({
        id: 'Project',
        name: 'Project',
        children: [
            new Workflow({
                id: 'main',
                name: 'main',
                parent: 'main',
                children: [
                    ...project.main.rootLayer.moduleIds.map(
                        (moduleId) =>
                            new ModuleInstance({
                                name: moduleId,
                                id: `main.${moduleId}`,
                            }),
                    ),
                    ...project.main.rootLayer.children.map((l) =>
                        createLayerNode('main', l),
                    ),
                ],
            }),
            new Macros({
                id: 'macros',
                name: 'macros',
                children: project.macros.map((macro: MacroVsf.MacroModel) => {
                    return new Workflow({
                        id: macro.uid,
                        name: macro.uid,
                        parent: 'macro',
                        children: [
                            new Api({
                                id: `Api_${macro.uid}`,
                                name: 'API',
                                children: [
                                    ...(macro.inputs || []).map((input) => {
                                        return new ApiIn({
                                            id: `Api_${input}_${macro.uid}`,
                                            name: `(${input.moduleId})${input.slotId}`,
                                        })
                                    }),
                                    ...(macro.outputs || []).map((output) => {
                                        return new ApiOut({
                                            id: `Api_${output}_${macro.uid}`,
                                            name: `(${output.moduleId})${output.slotId}`,
                                        })
                                    }),
                                ],
                            }),
                            ...macro.rootLayer.moduleIds.map(
                                (moduleId) =>
                                    new ModuleInstance({
                                        name: moduleId,
                                        id: `${macro.uid}.${moduleId}`,
                                    }),
                            ),
                            ...macro.rootLayer.children.map((l) =>
                                createLayerNode(macro.uid, l),
                            ),
                        ],
                    })
                }),
            }),
            new Worksheets({
                id: 'worksheets',
                name: 'Worksheets',
                children: project.worksheets.map((worksheet) => {
                    const children = of(worksheet).pipe(
                        mergeMap((ws) => {
                            const instance = project.runningWorksheets.find(
                                ({ worksheetId }) =>
                                    worksheetId === worksheet.id,
                            )
                            if (!instance) {
                                return from(appState.runWorksheet(ws.id)).pipe(
                                    map(() => undefined),
                                )
                            }
                            return of(instance)
                        }),
                        take(1),
                        map((instance) => {
                            return instance
                                ? [
                                      new Workflow({
                                          id: instance.uid,
                                          name: worksheet.id,
                                          parent: 'worksheet',
                                          children: [
                                              ...instance.workflow.rootLayer.moduleIds.map(
                                                  (moduleId) =>
                                                      new ModuleInstance({
                                                          name: moduleId,
                                                          id: `main.${moduleId}`,
                                                      }),
                                              ),
                                              ...instance.workflow.rootLayer.children.map(
                                                  (l) =>
                                                      createLayerNode(
                                                          'main',
                                                          l,
                                                      ),
                                              ),
                                          ],
                                      }),
                                      new Views({
                                          id: `${worksheet.id}_views`,
                                          name: 'Views',
                                          parent: 'worksheet',
                                          children: worksheet.views?.map(
                                              ({ id }) => {
                                                  return new View({
                                                      id: `${worksheet.id}~view~${id}`,
                                                      name: id,
                                                      worksheet: worksheet.id,
                                                  })
                                              },
                                          ),
                                      }),
                                  ]
                                : undefined
                        }),
                    )
                    return new Worksheet({
                        id: worksheet.id,
                        name: worksheet.id,
                        children: children,
                    })
                }),
            }),
            new Views({
                id: 'views',
                name: 'Views',
                parent: 'main',
                children: Object.entries(project.views).map(([k]) => {
                    return new View({ id: k, name: k })
                }),
            }),
        ],
    })
}

/**
 * @category View
 */
class NodeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Factories
     */
    static NodeTypeFactory: Record<NodeProjectCategory, string> = {
        Node: '',
        Project: 'fas fa-rocket-launch',
        Workflow: 'fas fa-sitemap',
        ModuleInstance: 'fas fa-cube',
        Layer: 'fas fa-object-group',
        Macros: 'fas fa-play',
        Api: 'fas fa-door-open',
        ApiIn: 'fas fa-sign-in-alt',
        ApiOut: 'fas fa-sign-out-alt',
        Views: 'fas fa-code',
        View: 'fas fa-code',
        Worksheets: 'fas fa-vials ',
        Worksheet: 'fas fa-vial ',
    }

    /**
     * @group Immutable Constants
     */
    public readonly node: NodeProjectBase

    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string =
        'w-100 d-flex align-items-center my-1 fv-pointer'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        state: ImmutableTree.State<NodeProjectBase>
        node: NodeProjectBase
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: `${NodeView.NodeTypeFactory[this.node.category]} mx-1`,
            },
            { tag: 'div', innerText: this.node.name },
        ]
    }
}
