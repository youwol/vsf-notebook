import {
    attr$,
    childrenFromStore$,
    FromStoreChildrenStream$,
    VirtualDOM,
} from '@youwol/flux-view'

import { asMutable, Immutable, Immutable$ } from '@youwol/vsf-core'
import { Observable, Subject } from 'rxjs'

/**
 * @category View
 */
export class HeadersView<T> implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 d-flex pb-1'

    /**
     * @group Observables
     */
    public readonly children: FromStoreChildrenStream$<Immutable<T>>

    constructor({
        selected$,
        entities$,
        onClose,
        text,
    }: {
        entities$: Immutable$<T[]>
        selected$: Subject<Immutable<T>>
        onClose: (entity: Immutable<T>) => void
        text: (entity: Immutable<T>) => string
    }) {
        const buffer$ = asMutable<Observable<Immutable<T>[]>>(entities$)
        this.children = childrenFromStore$(buffer$, (entity: Immutable<T>) => {
            return {
                class: attr$(
                    selected$,
                    (selected): string =>
                        selected == entity
                            ? 'fv-border-bottom-focus'
                            : 'fv-border-bottom-primary',
                    {
                        wrapper: (d) =>
                            `${d} d-flex fv-pointer px-1 mr-2 align-items-center`,
                    },
                ),
                children: [
                    {
                        innerText: text(entity),
                    },
                    {
                        class: 'fas fa-times ml-1 fv-text-disabled fv-pointer fv-hover-text-error',
                        onclick: () => onClose(entity),
                    },
                ],
                onclick: () => {
                    selected$.next(entity)
                },
            }
        })
    }
}
