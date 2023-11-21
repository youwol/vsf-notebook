import { AppState } from './app.state'
import { AppView } from './app.view'
import { render } from '@youwol/rx-vdom'
import { load$ } from './load'
import { Client } from '@youwol/webpm-client'

const assetId = new URLSearchParams(window.location.search).get('id')
load$(assetId, Client['initialLoadingScreen']).subscribe((data) => {
    const vDOM = new AppView({
        state: new AppState({ assetId, originalReplSource: data.content }),
    })
    document.body.appendChild(render(vDOM))
})

export {}
