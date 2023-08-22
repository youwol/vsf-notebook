import { DockableTabs } from '@youwol/fv-tabs'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../../app.state'
import { ImmutableTree } from '@youwol/fv-tree'
import { Immutable, Projects, Macros as MacroVsf } from '@youwol/vsf-core'

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
export class ProjectView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly state: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            child$(this.state.projectExplorerState$, (state) => {
                return new ImmutableTree.View({
                    state,
                    headerView: (state, node: NodeProjectBase) => {
                        return new NodeView({ state, node })
                    },
                })
            }),
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
        children?: NodeProjectBase[]
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
export class View extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'View'

    constructor(params: { id: string; name: string }) {
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
) {
    return new ProjectNode({
        id: 'Project',
        name: 'Project',
        children: [
            new Workflow({
                id: 'main',
                name: 'main',
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
            new Views({
                id: 'views',
                name: 'HTML',
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
class NodeView implements VirtualDOM {
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
    public readonly children: VirtualDOM[]

    constructor(params: {
        state: ImmutableTree.State<NodeProjectBase>
        node: NodeProjectBase
    }) {
        Object.assign(this, params)
        this.children = [
            { class: `${NodeView.NodeTypeFactory[this.node.category]} mx-1` },
            { innerText: this.node.name },
        ]
    }
}
