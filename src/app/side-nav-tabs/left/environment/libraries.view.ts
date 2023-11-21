import { ImmutableTree } from '@youwol/rx-tree-views'
import { Immutable, Projects } from '@youwol/vsf-core'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

type NodeToolboxesCategory = 'Node' | 'Libraries' | 'Library'

/**
 * @category Nodes
 */
export abstract class NodeLibrariesBase extends ImmutableTree.Node {
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
        children?: NodeLibrariesBase[]
    }) {
        super({ id, children })
        this.name = name
    }
}

/**
 * @category Nodes
 */
export class LibrariesNode extends NodeLibrariesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Libraries'

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
export class LibraryNode extends NodeLibrariesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Library'

    constructor(params: { id: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

export function createEnvLibRootNode(
    project: Immutable<Projects.ProjectState>,
) {
    return new LibrariesNode({
        id: 'libraries',
        name: 'Libraries',
        children: Object.entries(project.environment.libraries).map(
            ([name, module]) => {
                const setup = module['setup']
                const fullName = setup
                    ? `${name}: ${module['setup'].name}#${module['setup'].version}`
                    : name
                return new LibraryNode({
                    name: fullName,
                    id: name,
                })
            },
        ),
    })
}

/**
 * @category View
 */
export class LibNodeView implements VirtualDOM<'div'> {
    /**
     * @group Factories
     */
    static NodeTypeFactory: Record<NodeToolboxesCategory, string> = {
        Node: '',
        Libraries: 'fas fa-shapes',
        Library: 'fas fa-microchip',
    }

    /**
     * @group Immutable Constants
     */
    public readonly node: NodeLibrariesBase
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
        state: ImmutableTree.State<NodeLibrariesBase>
        node: NodeLibrariesBase
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: `${
                    LibNodeView.NodeTypeFactory[this.node.category]
                } mx-1`,
            },
            { tag: 'div', innerText: this.node.name },
        ]
    }
}
