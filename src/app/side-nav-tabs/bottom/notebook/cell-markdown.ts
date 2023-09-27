import { AppState } from '../../../app.state'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { Immutable, Projects } from '@youwol/vsf-core'
import { Common } from '@youwol/fv-code-mirror-editors'
import {
    debounceTime,
    delay,
    filter,
    mergeMap,
    take,
    withLatestFrom,
} from 'rxjs/operators'
import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { CellWrapperView } from './cell.view'
import { NotebookCellTrait } from './repl.tab'

function instrumentMardownSource(source: string) {
    let n = 0
    const adapt = (line: string, starter: string) => {
        return line.startsWith(starter)
            ? {
                  parsed: true,
                  value:
                      line +
                      `<i data-level="${
                          starter.length
                      }" id="section_${n++}" class="vsf-nb-section" data-title="${line
                          .substring(starter.length)
                          .trim()}"></i>`,
              }
            : { parsed: false, value: line }
    }
    const lines = source.split('\n').map((line) => {
        line = line.trim()
        const { value } = ['###', '##', '#'].reduce(
            (acc, e) => {
                return acc.parsed ? acc : adapt(line, e)
            },
            { parsed: false, value: line },
        )
        return value
    })
    return lines.join('\n')
}

export function cellMarkdownView(
    state: AppState,
    cellState: NotebookCellTrait,
    selectedCell$: Subject<Immutable<NotebookCellTrait>>,
    mdExecuted$: Subject<boolean>,
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
            innerHTML: attr$(
                editionMode$.pipe(
                    filter((mode) => mode === 'view'),
                    withLatestFrom(cellState.ideState.updates$['./repl']),
                ),
                ([_, file]) => {
                    const srcInstrumented = instrumentMardownSource(
                        file.content,
                    )
                    const content = window['marked'].parse(srcInstrumented)
                    setTimeout(() => mdExecuted$.next(true), 0)
                    return content
                },
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

/**
 * @category View
 */
export class TableOfContentView implements VirtualDOM {
    /**
     * @group Immutable Constant
     */
    public readonly markdownUpdate$: Observable<boolean>
    /**
     * @group Immutable DOM Constant
     */
    public readonly class = 'w-100 h-100 overflow-auto'
    /**
     * @group Immutable DOM Constant
     */
    public readonly children: VirtualDOM[]

    constructor(params: { markdownUpdate$: Observable<boolean> }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'h3',
                class: 'w-100 text-center',
                innerText: 'Table of content',
            },
            child$(
                this.markdownUpdate$.pipe(debounceTime(100)),
                () => {
                    const sections =
                        document.querySelectorAll('.vsf-nb-section')
                    return {
                        children: [...sections].map((e: HTMLElement) => {
                            return {
                                style: {
                                    paddingLeft: `${
                                        15 * parseInt(e.dataset.level)
                                    }px`,
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                },
                                innerText: e.dataset.title,
                            }
                        }),
                    }
                },
                {
                    untilFirst: {
                        class: 'w-100 d-flex justify-content-center',
                        children: [{ class: 'fas fa-spinner fa-spin' }],
                    },
                },
            ),
        ]
    }
}
