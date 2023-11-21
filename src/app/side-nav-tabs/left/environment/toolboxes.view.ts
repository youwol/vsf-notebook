import { ImmutableTree } from '@youwol/rx-tree-views'
import { Immutable, Projects } from '@youwol/vsf-core'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

export type NodeToolboxesCategory = 'Node' | 'Toolboxes' | 'Toolbox' | 'Module'

/**
 * @category Nodes
 */
export abstract class NodeToolboxesBase extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */
    public readonly name: string

    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Node'

    protected constructor({
        id,
        name,
        children,
    }: {
        id: string
        name: string
        children?: NodeToolboxesBase[]
    }) {
        super({ id, children })
        this.name = name
    }
}

/**
 * @category Nodes
 */
export class ToolboxesNode extends NodeToolboxesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Toolboxes'

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
export class ToolboxNode extends NodeToolboxesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Toolbox'

    /**
     * @group Immutable Constants
     */
    public readonly documentation?: string

    constructor(params: {
        id: string
        name: string
        documentation: string
        children
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
export class ModuleNode extends NodeToolboxesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Module'

    /**
     * @group Immutable Constants
     */
    public readonly documentation?: string

    constructor(params: { id: string; documentation: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

export function createEnvRootNode(project: Immutable<Projects.ProjectState>) {
    return new ToolboxesNode({
        id: 'toolboxes',
        name: 'toolboxes',
        children: project.environment.toolboxes.map((toolbox) => {
            return new ToolboxNode({
                name: toolbox.name,
                id: toolbox.uid,
                documentation: toolbox.documentation,
                children: toolbox.modules.map((module) => {
                    return new ModuleNode({
                        name: module.declaration.typeId,
                        id: module.declaration.typeId,
                        documentation: module.declaration.documentation,
                    })
                }),
            })
        }),
    })
}

/**
 * @category View
 */
export class NodeView implements VirtualDOM<'div'> {
    /**
     * @group Factories
     */
    static NodeTypeFactory: Record<NodeToolboxesCategory, string> = {
        Node: '',
        Toolboxes: 'fas fa-shapes',
        Toolbox: 'fas fa-cubes',
        Module: 'fas fa-cube',
    }

    /**
     * @group Immutable Constants
     */
    public readonly node: NodeToolboxesBase
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
        state: ImmutableTree.State<NodeToolboxesBase>
        node: NodeToolboxesBase
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
