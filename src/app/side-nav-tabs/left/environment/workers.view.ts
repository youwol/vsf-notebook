import { ImmutableTree } from '@youwol/fv-tree'
import { Immutable, Projects } from '@youwol/vsf-core'
import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import { WorkersPoolTypes } from '@youwol/cdn-client'

export type NodeWorkersCategory = 'Pools' | 'Pool'

/**
 * @category Nodes
 */
export abstract class NodeWorkersBase extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeWorkersCategory

    /**
     * @group Immutable Constants
     */
    public readonly name: string

    protected constructor({
        id,
        name,
        children,
    }: {
        id: string
        name: string
        children?: NodeWorkersBase[]
    }) {
        super({ id, children })
        this.name = name
    }
}

/**
 * @category Nodes
 */
export class PoolsNode extends NodeWorkersBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeWorkersCategory = 'Pools'

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
export class PoolNode extends NodeWorkersBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeWorkersCategory = 'Pool'

    /**
     * @group Immutable Constants
     */
    public readonly instance: Immutable<WorkersPoolTypes.WorkersPool>

    constructor(params: {
        id: string
        name: string
        instance: Immutable<WorkersPoolTypes.WorkersPool>
    }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

export function createWorkersRootNode(
    project: Immutable<Projects.ProjectState>,
) {
    return new PoolsNode({
        id: 'workersPools',
        name: 'workers pools',
        children: project.environment.workersPools.map((pool) => {
            return new PoolNode({
                name: pool.model.id,
                id: pool.model.id,
                instance: pool.instance,
            })
        }),
    })
}

/**
 * @category View
 */
export class WorkersNodeView implements VirtualDOM {
    /**
     * @group Factories
     */
    static NodeTypeFactory: Record<NodeWorkersCategory, string> = {
        Pools: 'fas fa-cogs',
        Pool: 'fas fa-cog',
    }

    /**
     * @group Immutable Constants
     */
    public readonly node: NodeWorkersBase

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
        state: ImmutableTree.State<NodeWorkersBase>
        node: NodeWorkersBase
    }) {
        Object.assign(this, params)

        this.children = [
            {
                class: `${
                    WorkersNodeView.NodeTypeFactory[this.node.category]
                } mx-1`,
            },
            { innerText: this.node.name },
            this.node instanceof PoolNode
                ? new PoolInstancesView(this.node)
                : {},
        ]
    }
}

class PoolInstancesView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        transform: 'scale(0.7)',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children

    constructor(node: PoolNode) {
        this.children = children$(node.instance.workers$, (workers) => {
            const workerIds = Object.keys(workers)
            return [
                ...workerIds.map((workerId) => {
                    return {
                        class: attr$(
                            node.instance.busyWorkers$,
                            (busies): string =>
                                busies.includes(workerId) ? 'fv-blink' : '',
                            {
                                wrapper: (d) =>
                                    `${d} fas fa-circle p-1 rounded fv-text-success fv-hover-bg-secondary`,
                            },
                        ),
                        onclick: (ev) => {
                            console.log(workerId)
                            ev.stopPropagation()
                        },
                    }
                }),
                ...Array.from(
                    Array(node.instance.pool.stretchTo - workerIds.length),
                ).map(() => {
                    return {
                        class: 'fas fa-circle-notch  mx-1',
                    }
                }),
            ]
        })
    }
}
