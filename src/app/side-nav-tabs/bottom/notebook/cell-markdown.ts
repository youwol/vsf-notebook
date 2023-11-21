import { AppState } from '../../../app.state'
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs'
import { Immutable, Projects } from '@youwol/vsf-core'
import { Common } from '@youwol/rx-code-mirror-editors'
import {
    debounceTime,
    delay,
    filter,
    mergeMap,
    take,
    withLatestFrom,
} from 'rxjs/operators'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { CellWrapperView } from './cell.view'
import { NotebookCellTrait } from './notebook.tab'

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
        const { value } = ['#####', '####', '###', '##', '#'].reduce(
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
            tag: 'div',
            class: {
                source$: editionMode$,
                vdomMap: (mode: 'view' | 'edit') =>
                    mode == 'view' ? 'd-none' : '',
            },
            children: [ideView],
        }
        const readMdView = {
            tag: 'div',
            class: {
                source$: editionMode$,
                vdomMap: (mode: 'view' | 'edit') =>
                    mode == 'edit' ? 'd-none' : 'md-reader',
            },
            innerHTML: {
                source$: editionMode$.pipe(
                    filter((mode) => mode === 'view'),
                    withLatestFrom(cellState.ideState.updates$['./repl']),
                ),
                vdomMap: ([_, file]) => {
                    const srcInstrumented = instrumentMardownSource(
                        file.content,
                    )
                    const content = window['marked'].parse(srcInstrumented)
                    setTimeout(() => mdExecuted$.next(true), 0)
                    return content
                },
            },
            ondblclick: () => {
                editionMode$.next('edit')
            },
        }
        return {
            tag: 'div',
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

export class MarkdownActionView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'fv-hover-text-focus'
    public readonly children: ChildrenLike
    public readonly onclick: () => void
    constructor(params: {
        onExe
        editionMode$: BehaviorSubject<'view' | 'edit'>
    }) {
        this.children = [
            {
                tag: 'div',
                class: {
                    source$: params.editionMode$,
                    vdomMap: (mode): string =>
                        mode == 'view' ? 'fa-pen' : 'fa-eye',
                    wrapper: (d) => `${d} fv-text-success fas fv-pointer p-1`,
                },
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
export class TableOfContentView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constant
     */
    public readonly tag = 'div'

    /**
     * @group Immutable Constant
     */
    public readonly markdownUpdate$: Observable<boolean>
    /**
     * @group Immutable Constant
     */
    public readonly scrollableElement$: Observable<HTMLElement>
    /**
     * @group Immutable DOM Constant
     */
    public readonly class = 'w-100 h-100 overflow-auto fv-bg-background-alt'
    /**
     * @group Immutable DOM Constant
     */
    public readonly children: ChildrenLike

    constructor(params: {
        markdownUpdate$: Observable<boolean>
        scrollableElement$: Observable<HTMLElement>
    }) {
        Object.assign(this, params)
        const highlighted$ = new BehaviorSubject<HTMLElement>(undefined)
        this.children = [
            {
                tag: 'h3',
                class: 'w-100 text-center',
                innerText: 'Table of content',
            },
            {
                source$: combineLatest([
                    this.markdownUpdate$.pipe(debounceTime(100)),
                    this.scrollableElement$,
                ]),
                vdomMap: ([_, scroller]) => {
                    const maxHeight = scroller.getBoundingClientRect().height
                    scroller.onscroll = () => {
                        const a = retrieveSections()
                            .map((e: HTMLElement) => ({
                                e,
                                top:
                                    e.getBoundingClientRect().top -
                                    scroller.getBoundingClientRect().top,
                            }))
                            .filter(({ top }) => top < maxHeight)
                        a.reverse()
                        const element =
                            a[0].top < 0
                                ? a[0].e
                                : a.reduce((acc, e) => (e.top < 0 ? acc : e)).e
                        highlighted$.next(element)
                    }
                    return {
                        tag: 'div',
                        connectedCallback: () => {
                            // The next line force 'highlighting' the current section
                            scroller.onscroll(undefined)
                        },
                        children: retrieveSections().map((e: HTMLElement) => {
                            return {
                                tag: 'div',
                                class: {
                                    source$: highlighted$,
                                    vdomMap: (highlighted): string =>
                                        highlighted === e
                                            ? 'fv-text-secondary fv-xx-lighter'
                                            : '',
                                    wrapper: (d) =>
                                        `${d} fv-pointer fv-hover-text-focus`,
                                },
                                style: {
                                    paddingLeft: `${
                                        15 * parseInt(e.dataset.level)
                                    }px`,
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                },
                                innerText: e.dataset.title,
                                onclick: () => {
                                    scroller.scroll({
                                        top:
                                            e.getBoundingClientRect().top -
                                            scroller.getBoundingClientRect()
                                                .top +
                                            scroller.scrollTop,
                                        behavior: 'smooth',
                                    })
                                },
                            }
                        }),
                    }
                },
                untilFirst: {
                    tag: 'div',
                    class: 'w-100 d-flex justify-content-center',
                    children: [{ tag: 'div', class: 'fas fa-spinner fa-spin' }],
                },
            },
        ]
    }
}

function retrieveSections() {
    const sections = new Array(
        ...document.querySelectorAll('.vsf-nb-section'),
    ) as HTMLElement[]
    sections.sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    )
    return sections
}
