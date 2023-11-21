import { VirtualDOM, ChildrenLike, FluxViewVirtualDOM } from '@youwol/rx-vdom'
import { AppState } from './app.state'
import { TopBannerView } from './top-banner'
import { DockableTabs } from '@youwol/rx-tab-views'
import { ContentView } from './content-view/content.view'
/**
 * @category View
 * @Category Entry Point
 */
export class AppView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'h-100 w-100 d-flex flex-column fv-text-primary fv-bg-background'
    /**
     * @group Immutable DOM Constants
     */
    children: ChildrenLike
    /**
     * @group States
     */
    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            new TopBannerView() as FluxViewVirtualDOM,
            {
                tag: 'div',
                class: 'w-100 flex-grow-1',
                style: {
                    minHeight: '0px',
                },
                children: [new MainContentView({ state: this.state })],
            },
        ]
    }
}

/**
 * @category View
 */
export class MainContentView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'h-100 w-100 d-flex'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
        position: 'relative' as const,
    }
    /**
     * @group Immutable DOM Constants
     */
    children: ChildrenLike
    /**
     * @group States
     */
    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        const leftSideNavView = new DockableTabs.View({
            state: this.state.leftSideNavState,
            styleOptions: {
                initialPanelSize: '300px',
            },
        })
        const bottomSideNavView = new DockableTabs.View({
            state: this.state.bottomSideNavState,
            styleOptions: {
                initialPanelSize: '300px',
            },
        })
        const rightSideNavView = new DockableTabs.View({
            state: this.state.rightSideNavState,
            styleOptions: {
                initialPanelSize: '300px',
            },
        })
        this.children = [
            leftSideNavView,
            {
                tag: 'div',
                class: 'flex-grow-1 h-100 d-flex flex-column',
                style: {
                    position: 'relative',
                    minWidth: '0px',
                },
                children: [
                    {
                        tag: 'div',
                        class: 'flex-grow-1',
                        style: {
                            minHeight: '0px',
                        },
                        children: [
                            new ContentView({
                                state: this.state,
                            }),
                        ],
                    },
                    bottomSideNavView,
                ],
            },
            rightSideNavView,
        ]
    }
}
