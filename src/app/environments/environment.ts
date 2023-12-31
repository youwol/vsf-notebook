import { installJournalModule, Journal } from '@youwol/logging'
import { ObjectJs } from '@youwol/rx-tree-views'
import * as webpmClient from '@youwol/webpm-client'
import { ToolBox, ExecutionJournal, DocumentationTrait } from '@youwol/vsf-core'

export const viewsFactory: Journal.DataViewsFactory = [
    {
        name: 'default',
        description: 'Raw view of data',
        isCompatible: () => true,
        view: (data) => {
            const state = new ObjectJs.State({
                title: ' ',
                data,
            })
            return new ObjectJs.View({ state })
        },
    },
    {
        name: 'ExecutionJournal',
        description: 'ExecutionJournal view',
        isCompatible: (d) => d instanceof ExecutionJournal,
        view: (data: ExecutionJournal) => {
            // @youwol/logging needs to be updated to use webpm-client
            return installJournalModule(webpmClient).then((module) => {
                const state = new module.JournalState({
                    journal: {
                        title: "Module's Journal",
                        abstract: '',
                        pages: data.pages,
                    },
                })
                return new module.JournalView({ state })
            })
        },
    },
    {
        name: 'Documentation',
        description: 'Expose documentation',
        isCompatible: (d: DocumentationTrait) => d.documentation != undefined,
        view: (data: ToolBox) => {
            return {
                tag: 'iframe',
                src: data.documentation,
                width: '100%',
                style: { minHeight: '50vh' },
            }
        },
    },
]
