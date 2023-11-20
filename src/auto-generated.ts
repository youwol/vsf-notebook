
const runTimeDependencies = {
    "externals": {
        "@youwol/vsf-core": "^0.3.0",
        "@youwol/vsf-canvas": "^0.3.0",
        "rxjs": "^7.5.6",
        "@youwol/logging": "^0.2.0",
        "@youwol/http-clients": "^3.0.0",
        "@youwol/http-primitives": "^0.2.0",
        "@youwol/rx-vdom": "^1.0.1",
        "@youwol/webpm-client": "^3.0.0",
        "@youwol/rx-tab-views": "^0.3.0",
        "@youwol/os-top-banner": "^0.2.0",
        "@youwol/rx-code-mirror-editors": "^0.4.0",
        "@youwol/rx-tree-views": "^0.3.0",
        "three": "^0.152.0",
        "marked": "^4.2.3"
    },
    "includedInBundle": {
        "d3-dag": "0.8.2",
        "client-zip": "2.3.0"
    }
}
const externals = {
    "@youwol/vsf-core": "window['@youwol/vsf-core_APIv03']",
    "@youwol/vsf-canvas": "window['@youwol/vsf-canvas_APIv03']",
    "rxjs": "window['rxjs_APIv7']",
    "@youwol/logging": "window['@youwol/logging_APIv02']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv3']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv02']",
    "@youwol/rx-vdom": "window['@youwol/rx-vdom_APIv1']",
    "@youwol/webpm-client": "window['@youwol/webpm-client_APIv3']",
    "@youwol/rx-tab-views": "window['@youwol/rx-tab-views_APIv03']",
    "@youwol/os-top-banner": "window['@youwol/os-top-banner_APIv02']",
    "@youwol/rx-code-mirror-editors": "window['@youwol/rx-code-mirror-editors_APIv04']",
    "@youwol/rx-tree-views": "window['@youwol/rx-tree-views_APIv03']",
    "three": "window['THREE_APIv0152']",
    "marked": "window['marked_APIv4']",
    "rxjs/operators": "window['rxjs_APIv7']['operators']"
}
const exportedSymbols = {
    "@youwol/vsf-core": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/vsf-core"
    },
    "@youwol/vsf-canvas": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/vsf-canvas"
    },
    "rxjs": {
        "apiKey": "7",
        "exportedSymbol": "rxjs"
    },
    "@youwol/logging": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/logging"
    },
    "@youwol/http-clients": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/rx-vdom": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/rx-vdom"
    },
    "@youwol/webpm-client": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/webpm-client"
    },
    "@youwol/rx-tab-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-tab-views"
    },
    "@youwol/os-top-banner": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/os-top-banner"
    },
    "@youwol/rx-code-mirror-editors": {
        "apiKey": "04",
        "exportedSymbol": "@youwol/rx-code-mirror-editors"
    },
    "@youwol/rx-tree-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-tree-views"
    },
    "three": {
        "apiKey": "0152",
        "exportedSymbol": "THREE"
    },
    "marked": {
        "apiKey": "4",
        "exportedSymbol": "marked"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./index.ts",
    "loadDependencies": [
        "@youwol/vsf-core",
        "@youwol/vsf-canvas",
        "rxjs",
        "@youwol/logging",
        "@youwol/http-clients",
        "@youwol/http-primitives",
        "@youwol/rx-vdom",
        "@youwol/webpm-client",
        "@youwol/rx-tab-views",
        "@youwol/os-top-banner",
        "@youwol/rx-code-mirror-editors",
        "@youwol/rx-tree-views",
        "three",
        "marked"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@youwol/vsf-notebook': './index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/vsf-notebook/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/vsf-notebook',
        assetId:'QHlvdXdvbC92c2Ytbm90ZWJvb2s=',
    version:'0.1.3-wip',
    shortDescription:"",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/vsf-notebook&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@youwol/vsf-notebook',
    sourceGithub:'https://github.com/youwol/vsf-notebook',
    userGuide:'https://l.youwol.com/doc/@youwol/vsf-notebook',
    apiVersion:'01',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/vsf-notebook_APIv01`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/vsf-notebook#0.1.3-wip~dist/@youwol/vsf-notebook/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/vsf-notebook/${entry.name}_APIv01`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
