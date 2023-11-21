import { DockableTabs } from '@youwol/rx-tab-views'
import { AppState } from '../../app.state'

import {
    asMutable,
    Immutable,
    Deployers,
    Immutables,
    WorkersPoolRunTime,
} from '@youwol/vsf-core'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { RxChildren, VirtualDOM } from '@youwol/rx-vdom'
import { HeadersView } from './common'
import { map, switchMap } from 'rxjs/operators'

/**
 * @category View
 */
export class WorkersTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Workers',
            title: 'Workers',
            icon: 'fas fa-microchip',
            content: () => {
                const selected$ =
                    new BehaviorSubject<Deployers.WorkerEnvironmentTrait>(
                        undefined,
                    )

                state.selectedWorkers$.subscribe((m) => {
                    selected$.next(m.slice(-1)[0])
                })
                return {
                    tag: 'div',
                    class: 'w-100 p-2 overflow-auto mx-auto d-flex flex-column',
                    style: {
                        height: '50vh',
                    },
                    children: [
                        new HeadersView({
                            entities$: state.selectedWorkers$,
                            selected$,
                            onClose: (m) => state.closeWorkerEnvironment(m),
                            text: (m) => m.workerId,
                        }),
                        new ContentView({ state, selected$ }),
                    ],
                }
            },
        })
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
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 flex-grow-1 p-2'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = { minHeight: '0px' }

    /**
     * @group Observables
     */
    public readonly children: RxChildren<
        'sync',
        Deployers.WorkerEnvironmentTrait
    >

    constructor({
        state,
        selected$,
    }: {
        state: AppState
        selected$: Subject<Immutable<Deployers.WorkerEnvironmentTrait>>
    }) {
        const buffer$ = asMutable<
            Observable<Deployers.WorkerEnvironmentTrait[]>
        >(state.selectedWorkers$)
        this.children = {
            policy: 'sync',
            source$: buffer$,
            vdomMap: (worker) => {
                return {
                    tag: 'div',
                    class: {
                        source$: selected$,
                        vdomMap: (
                            selected: Immutable<Deployers.WorkerEnvironmentTrait>,
                        ) =>
                            selected && selected.workerId == worker.workerId
                                ? 'h-100 w-100'
                                : 'h-100 w-100 d-none',
                    },
                    children: [
                        {
                            tag: 'div',
                            innerText: {
                                source$: worker.workersPool.busyWorkers$,
                                vdomMap: (
                                    busyWorkers: Immutables<string>,
                                ): string => {
                                    return busyWorkers.includes(worker.workerId)
                                        ? 'busy'
                                        : 'available'
                                },
                                wrapper: (status: string) =>
                                    `Status is: ${status}`,
                            },
                        },
                        {
                            tag: 'div',
                            class: 'my-1',
                        },
                        {
                            tag: 'div',
                            innerText: {
                                source$: worker.workersPool.runningTasks$,
                                vdomMap: (
                                    tasks: {
                                        workerId: string
                                        title: string
                                    }[],
                                ) => {
                                    const task = tasks.find(
                                        (t) => t.workerId == worker.workerId,
                                    )
                                    return task
                                        ? `Running task: ${task.title}`
                                        : 'No task running'
                                },
                            },
                        },
                        { tag: 'div', class: 'my-1' },
                        {
                            tag: 'div',
                            children: [
                                {
                                    tag: 'div',
                                    innerText: 'Dependencies installed:',
                                },
                                {
                                    tag: 'div',
                                    class: 'px-2',
                                    children: {
                                        policy: 'replace',
                                        source$: state.project$.pipe(
                                            map((p) =>
                                                p.environment.workersPools.find(
                                                    (pool) =>
                                                        pool.instance ==
                                                        worker.workersPool,
                                                ),
                                            ),
                                            switchMap((pool) => {
                                                return pool.runtimes$
                                            }),
                                        ),
                                        vdomMap: (
                                            runtimes: Immutables<WorkersPoolRunTime>,
                                        ) => {
                                            return Object.keys(
                                                runtimes[worker.workerId]
                                                    .importedBundles,
                                            ).map((key) => ({
                                                tag: 'div',
                                                innerText: key,
                                            }))
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                }
            },
        }
    }
}
