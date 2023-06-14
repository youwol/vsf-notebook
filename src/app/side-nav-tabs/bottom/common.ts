import {
    attr$,
    childrenFromStore$,
    FromStoreChildrenStream$,
    VirtualDOM,
} from '@youwol/flux-view'

import { asMutable, Immutable, Immutable$, Modules } from '@youwol/vsf-core'
import { Observable, Subject } from 'rxjs'

/**
 * @category View
 */
export class HeadersView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 d-flex pb-1'

    /**
     * @group Observables
     */
    public readonly children: FromStoreChildrenStream$<Modules.ImplementationTrait>

    constructor({
        selected$,
        modules$,
        onClose,
    }: {
        modules$: Immutable$<Modules.ImplementationTrait[]>
        selected$: Subject<Immutable<Modules.ImplementationTrait>>
        onClose: (module: Immutable<Modules.ImplementationTrait>) => void
    }) {
        const buffer$ =
            asMutable<Observable<Modules.ImplementationTrait[]>>(modules$)
        this.children = childrenFromStore$(
            buffer$,
            (module: Modules.ImplementationTrait) => {
                return {
                    class: attr$(
                        selected$,
                        (selected): string =>
                            selected == module
                                ? 'fv-border-bottom-focus'
                                : 'fv-border-bottom-primary',
                        {
                            wrapper: (d) =>
                                `${d} d-flex fv-pointer px-1 mr-2 align-items-center`,
                        },
                    ),
                    children: [
                        {
                            innerText: module.uid,
                        },
                        {
                            class: 'fas fa-times ml-1 fv-text-disabled fv-pointer fv-hover-text-error',
                            onclick: () => onClose(module),
                        },
                    ],
                    onclick: () => {
                        selected$.next(module)
                    },
                }
            },
        )
    }
}
