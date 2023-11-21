import { ImmutableTree } from '@youwol/rx-tree-views'

import { Immutable, Projects, Immutables } from '@youwol/vsf-core'
import { ChildrenLike, RxAttribute, VirtualDOM } from '@youwol/rx-vdom'
import { WorkersPoolTypes } from '@youwol/webpm-client'
import { map, mergeMap, tap } from 'rxjs/operators'
import { merge, Observable, of } from 'rxjs'

export type NodeWorkersCategory =
    | 'Pools'
    | 'Pool'
    | 'Worker'
    | 'Package'
    | 'Version'

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
            children: [],
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class WorkerNode extends NodeWorkersBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeWorkersCategory = 'Worker'

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
            children: [],
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class PackageNode extends NodeWorkersBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeWorkersCategory = 'Package'

    // noinspection JSUnusedGlobalSymbols -- the class needs to be 'auto' clonable `const n1 = new PackageNode(); const n2 = new PackageNode(n)`
    /**
     * @group Immutable Constants
     */
    public readonly versions: Immutables<string>

    constructor(params: {
        id: string
        name: string
        versions: Immutables<string>
    }) {
        super({
            id: params.id,
            name: params.name,
            children: params.versions.map(
                (v) => new VersionNode({ id: `${params.id}.{v}`, name: v }),
            ),
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class VersionNode extends NodeWorkersBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeWorkersCategory = 'Version'

    constructor(params: { id: string; name: string }) {
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
export class WorkersNodeView implements VirtualDOM<'div'> {
    /**
     * @group Factories
     */
    static NodeTypeFactory: Record<NodeWorkersCategory, string> = {
        Pools: 'fas fa-network-wired',
        Pool: 'fas fa-server',
        Worker: 'fas fa-microchip',
        Package: 'fas fa-box',
        Version: 'fas fa-tag',
    }

    /**
     * @group Immutable Constants
     */
    public readonly node: NodeWorkersBase
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
        state: ImmutableTree.State<NodeWorkersBase>
        node: NodeWorkersBase
    }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: `${
                    WorkersNodeView.NodeTypeFactory[this.node.category]
                } mx-1`,
            },
            { tag: 'div', innerText: this.node.name },
            this.node instanceof PoolNode
                ? new PoolInstancesView(this.node)
                : this.node instanceof WorkerNode
                  ? new WorkerSuffixView({ node: this.node })
                  : { tag: 'div' },
        ]
    }
}

class StatusView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        transform: 'scale(0.7)',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: RxAttribute<Immutables<string>, string>

    constructor(params: {
        workerId: string
        busyWorkers$: Observable<Immutables<string>>
    }) {
        this.class = {
            source$: params.busyWorkers$,
            vdomMap: (busies): string =>
                busies.includes(params.workerId) ? 'fa-play' : 'fa-circle ',
            wrapper: (d) => `${d} fas p-1 rounded fv-text-success`,
        }
    }
}
class PoolInstancesView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(node: PoolNode) {
        this.children = {
            policy: 'replace',
            source$: node.instance.workers$,
            vdomMap: (workers) => {
                const workerIds = Object.keys(workers)
                return [
                    ...workerIds.map(
                        (workerId) =>
                            new StatusView({
                                workerId,
                                busyWorkers$: node.instance.busyWorkers$,
                            }),
                    ),
                    ...Array.from(
                        Array(node.instance.pool.stretchTo - workerIds.length),
                    ).map(() => {
                        return {
                            tag: 'div' as const,
                            style: {
                                transform: 'scale(0.7)',
                            },
                            class: 'fas fa-circle-notch  mx-1',
                        }
                    }),
                ]
            },
        }
    }
}

class WorkerSuffixView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable Constants
     */
    public readonly node: WorkerNode
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: 'd-flex align-items-center'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { node: WorkerNode }) {
        Object.assign(this, params)
        this.children = [
            new StatusView({
                workerId: this.node.id,
                busyWorkers$: this.node.instance.busyWorkers$,
            }),
            {
                tag: 'div',
                innerText: {
                    source$: this.node.instance.runningTasks$,
                    vdomMap: (tasks: { workerId: string; title: string }[]) => {
                        const task = tasks.find(
                            ({ workerId }) => workerId == this.node.id,
                        )
                        return task ? task.title : ''
                    },
                },
            },
        ]
    }
}
export function plugWorkersPoolUpdate({
    explorer,
    project,
}: {
    project: Projects.ProjectState
    explorer: ImmutableTree.State<NodeWorkersBase>
}) {
    return merge(
        ...project.environment.workersPools.map((wp) =>
            wp.instance.workers$.pipe(map((workers) => ({ workers, wp }))),
        ),
    ).pipe(
        tap(({ workers, wp }) => {
            Object.keys(workers).forEach((workerId) => {
                if (explorer.getNode(workerId) == undefined) {
                    explorer.addChild(
                        wp.model.id,
                        new WorkerNode({
                            id: workerId,
                            name: workerId,
                            instance: wp.instance,
                        }),
                    )
                }
            })
        }),
        mergeMap(({ workers, wp }) => {
            const empty = Object.keys(workers).reduce(
                (acc, e) => ({ ...acc, [e]: { importedBundles: {} } }),
                {},
            )
            // next line is fine, it is not deprecated
            return merge(of(empty), wp.runtimes$)
        }),
        tap((dependencies) => {
            Object.entries(dependencies).forEach(
                ([workerId, { importedBundles }]) => {
                    Object.entries(importedBundles).forEach(
                        ([name, versions]) => {
                            const node = new PackageNode({
                                id: `${workerId}.${name}`,
                                name: name,
                                versions: versions,
                            })
                            explorer.getNode(node.id)
                                ? explorer.replaceNode(node.id, node)
                                : explorer.addChild(workerId, node)
                        },
                    )
                },
            )
        }),
    )
}
