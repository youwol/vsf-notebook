type AllTags = keyof HTMLElementTagNameMap
export type Configuration = {
    TypeCheck: 'strict'
    SupportedHTMLTags: 'Dev' extends 'Prod' ? AllTags : DevTags
    WithFluxView: false
}

type DevTags =
    | 'div'
    | 'li'
    | 'ul'
    | 'h5'
    | 'h3'
    | 'h2'
    | 'iframe'
    | 'select'
    | 'option'
    | 'pre'
    | 'i'
