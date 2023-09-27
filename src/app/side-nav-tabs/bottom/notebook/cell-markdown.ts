import { AppState } from '../../../app.state'
import { BehaviorSubject, Subject } from 'rxjs'
import { Immutable, Projects } from '@youwol/vsf-core'
import { Common } from '@youwol/fv-code-mirror-editors'
import { delay, filter, mergeMap, take } from 'rxjs/operators'
import { attr$, VirtualDOM } from '@youwol/flux-view'
import { CellWrapperView } from './cell.view'
import { NotebookCellTrait } from './repl.tab'

export function cellMarkdownView(
    state: AppState,
    cellState: NotebookCellTrait,
    selectedCell$: Subject<Immutable<NotebookCellTrait>>,
) {
    const editionMode$ = new BehaviorSubject<'view' | 'edit'>('view')
    const child = (ideView: Common.CodeEditorView) => {
        editionMode$
            .pipe(
                filter((m) => m == 'edit'),
                take(1),
                delay(100),
                mergeMap(() => ideView.nativeEditor$),
            )
            .subscribe((editor) => editor.refresh())
        const editMdView = {
            class: attr$(editionMode$, (mode) =>
                mode == 'view' ? 'd-none' : '',
            ),
            children: [ideView],
        }
        const readMdView = {
            class: attr$(editionMode$, (mode) =>
                mode == 'edit' ? 'd-none' : 'md-reader',
            ),
            innerHTML: attr$(cellState.ideState.updates$['./repl'], (file) =>
                window['marked'].parse(file.content),
            ),
            ondblclick: () => {
                editionMode$.next('edit')
            },
        }
        return {
            children: [editMdView, readMdView],
        }
    }
    const onExe = () => {
        const mode = editionMode$.value == 'view' ? 'edit' : 'view'
        editionMode$.next(mode)
    }
    return new CellWrapperView({
        cellState,
        selectedCell$,
        onExe,
        withActions: [new MarkdownActionView({ onExe, editionMode$ })],
        language: 'markdown',
        child,
    })
}

/**
 * @category State
 */
export class CellMarkdownState implements NotebookCellTrait {
    /**
     * @group ImmutableConstant
     */
    public readonly mode = 'markdown'

    /**
     * @group States
     */
    public readonly ideState: Common.IdeState

    /**
     * @group States
     */
    public readonly appState: AppState

    constructor(params: { appState: AppState; content: string }) {
        Object.assign(this, params)
        this.ideState = new Common.IdeState({
            files: [
                {
                    path: './repl',
                    content: params.content,
                },
            ],
            defaultFileSystem: Promise.resolve(new Map<string, string>()),
        })
    }

    execute(
        project: Immutable<Projects.ProjectState>,
    ): Promise<Immutable<Projects.ProjectState>> {
        return Promise.resolve(project)
    }
}

export class MarkdownActionView {
    public readonly class = 'fv-hover-text-focus'
    public readonly children: VirtualDOM[]
    public readonly onclick
    constructor(params: {
        onExe
        editionMode$: BehaviorSubject<'view' | 'edit'>
    }) {
        this.children = [
            {
                class: attr$(
                    params.editionMode$,
                    (mode): string => (mode == 'view' ? 'fa-pen' : 'fa-eye'),
                    {
                        wrapper: (d) =>
                            `${d} fv-text-success fas fv-pointer p-1`,
                    },
                ),
            },
        ]
        this.onclick = () => {
            params.onExe()
        }
    }
}
