import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Immutable } from '@youwol/vsf-core'
import * as Tb from '../side-nav-tabs/left/environment/toolboxes.view'

/**
 * @category View
 */
export class DocumentationTab implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Properties
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

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
                      tag: 'div',
                      class: 'p-2 w-100 text-center',
                      innerText: 'No documentation URL has been exposed.',
                  },
        ]
    }
}
