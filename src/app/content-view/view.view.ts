import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { Immutable, Projects } from '@youwol/vsf-core'
import { View } from '../side-nav-tabs'

export class ViewTab implements VirtualDOM {
    public readonly state: AppState
    public readonly project: Immutable<Projects.ProjectState>
    public readonly node: View
    public readonly class = 'h-100 w-100 fv-bg-background-alt p-2'
    public readonly children: VirtualDOM[]

    constructor(params: {
        node: View
        state: AppState
        project: Immutable<Projects.ProjectState>
    }) {
        Object.assign(this, params)
        const view = this.project.views[this.node.id]
        this.children = [view(this.project.instancePool)]
    }
}
