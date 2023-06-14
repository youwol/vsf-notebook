import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'

import { Renderer3DView } from '@youwol/vsf-canvas'
import { filter } from 'rxjs/operators'

export class WorkflowTab implements VirtualDOM {
    public readonly class = 'h-100 w-100'
    public readonly state: AppState
    public readonly children: VirtualDOM
    public readonly style = {}

    constructor(params: { state: AppState; workflowId: string }) {
        Object.assign(this, params)
        const renderer3d = new Renderer3DView({
            project$: this.state.project$.pipe(filter((p) => p != undefined)),
            workflowId: params.workflowId,
            state: this.state,
        })
        this.children = [renderer3d]
    }
}
