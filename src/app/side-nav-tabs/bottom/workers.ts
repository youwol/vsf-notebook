import { DockableTabs } from '@youwol/fv-tabs'
import { AppState } from '../../app.state'

import { asMutable, Immutable, Projects } from '@youwol/vsf-core'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import {
    attr$,
    children$,
    childrenFromStore$,
    FromStoreChildrenStream$,
    VirtualDOM,
} from '@youwol/flux-view'
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
                    new BehaviorSubject<Projects.Workers.WorkerEnvironmentTrait>(
                        undefined,
                    )

                state.selectedWorkers$.subscribe((m) => {
                    selected$.next(m.slice(-1)[0])
                })
                return {
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
export class ContentView implements VirtualDOM {
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
    public readonly children: FromStoreChildrenStream$<Projects.Workers.WorkerEnvironmentTrait>

    constructor({
        state,
        selected$,
    }: {
        state: AppState
        selected$: Subject<Immutable<Projects.Workers.WorkerEnvironmentTrait>>
    }) {
        const buffer$ = asMutable<
            Observable<Projects.Workers.WorkerEnvironmentTrait[]>
        >(state.selectedWorkers$)
        this.children = childrenFromStore$(buffer$, (worker) => {
            return {
                class: attr$(selected$, (selected) =>
                    selected && selected.workerId == worker.workerId
                        ? 'h-100 w-100'
                        : 'h-100 w-100 d-none',
                ),
                children: [
                    {
                        innerText: attr$(
                            worker.workersPool.busyWorkers$,
                            (busyWorkers): string => {
                                return busyWorkers.includes(worker.workerId)
                                    ? 'busy'
                                    : 'available'
                            },
                            { wrapper: (status) => `Status is: ${status}` },
                        ),
                    },
                    {
                        class: 'my-1',
                    },
                    {
                        innerText: attr$(
                            worker.workersPool.runningTasks$,
                            (tasks) => {
                                const task = tasks.find(
                                    (t) => t.workerId == worker.workerId,
                                )
                                return task
                                    ? `Running task: ${task.title}`
                                    : 'No task running'
                            },
                        ),
                    },
                    {
                        class: 'my-1',
                    },
                    {
                        children: [
                            {
                                innerText: 'Dependencies installed:',
                            },
                            {
                                class: 'px-2',
                                children: children$(
                                    state.project$.pipe(
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
                                    (runtimes) => {
                                        return Object.keys(
                                            runtimes[worker.workerId]
                                                .importedBundles,
                                        ).map((key) => ({
                                            innerText: key,
                                        }))
                                    },
                                ),
                            },
                        ],
                    },
                ],
            }
        })
    }
}
