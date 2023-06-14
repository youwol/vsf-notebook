import { VirtualDOM } from '@youwol/flux-view'
import { Immutable } from '@youwol/vsf-core'
import * as Tb from '../side-nav-tabs/left/environment.tab'

/**
 * @category View
 */
export class DocumentationTab implements VirtualDOM {
    /**
     * @group Immutable Properties
     */
    public readonly node: Immutable<Tb.ToolboxNode | Tb.ModuleNode>
    /**
     * @group Immutable DOM Properties
     */
    public readonly class = 'h-100 w-100'
    /**
     * @group Immutable DOM Properties
     */
    public readonly children: VirtualDOM[]

    constructor(params: { node: Immutable<Tb.ModuleNode | Tb.ToolboxNode> }) {
        Object.assign(this, params)
        this.children = [
            this.node.documentation
                ? {
                      tag: 'iframe',
                      class: 'h-100 w-100',
                      src: this.node.documentation,
                  }
                : {
                      class: 'p-2 w-100 text-center',
                      innerText: 'No documentation URL has been exposed.',
                  },
        ]
    }
}
