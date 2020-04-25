import 'core-js/features/array/map'
import 'core-js/features/array/for-each'
import { SimpleFuzzyFilterTokenizer } from './simple-fuzzy-filter-tokenizer'
import { SimpleFuzzyFilterItemData, SimpleFuzzyFilterItemsIndex } from './simple-fuzzy-filter-items-index'

export type SimpleFuzzyFilterItemTextProvider<T> = (item: T) => string

export type SimpleFuzzyFilterHighlightItem = {
    text: string
    isMatched: boolean
}

export type SimpleFuzzyFilterMatchedItem<T> = {
    item: T
    highlight: SimpleFuzzyFilterHighlightItem[]
    isSameOrder: boolean
}

export type SimpleFuzzyFilterFilterOptions = {
    highlight: boolean
}

export type SimpleFuzzyFilterInitConfig<T> = {
    textProvider: SimpleFuzzyFilterItemTextProvider<T>
    items?: T[]
    initIndexOn?: 'construct' | 'first-filter'
    tokenizer?: {
        splitSymbols?: string[]
        splitByCase?: boolean
    }
    filter?: {
        sameOrderFirst: boolean
    }
}

export default class SimpleFuzzyFilter<T> {
    private textProvider: SimpleFuzzyFilterItemTextProvider<T>
    private tokenizer: SimpleFuzzyFilterTokenizer
    private index_: SimpleFuzzyFilterItemsIndex<T>

    constructor(config: SimpleFuzzyFilterInitConfig<T>) {
        config.tokenizer = config.tokenizer || {}

        this.textProvider = config.textProvider
        this.tokenizer = new SimpleFuzzyFilterTokenizer(config.tokenizer.splitSymbols, config.tokenizer.splitByCase)
        this.index_ = new SimpleFuzzyFilterItemsIndex<T>(this.textProvider, this.tokenizer, config.items || [])

        if (config.initIndexOn == 'construct') {
            this.index_.indexedItems
        }
    }

    get index(): SimpleFuzzyFilterItemsIndex<T> {
        return this.index_
    }

    filter(query: string): SimpleFuzzyFilterMatchedItem<T>[] {
        return this.doFilter(query)
    }

    private doFilter(query: string): SimpleFuzzyFilterMatchedItem<T>[] {
        const answer = [] as SimpleFuzzyFilterMatchedItem<T>[]
        const queryTokens = this.getQueryTokens(query)
        const items = this.index_.indexedItems

        items.forEach(item => {
            const matched = this.doFilterItem(item, queryTokens)

            if (matched) {
                answer.push(matched)
            }
        })

        return answer
    }

    private getQueryTokens(query: string): string[] {
        const answer = [] as string[]
        const tokenizedItems = this.tokenizer.tokenize(query)

        tokenizedItems.forEach(item => {
            if (item.isToken) {
                answer.push(item.text.toUpperCase())
            }
        })

        return answer
    }

    private doFilterItem(item: SimpleFuzzyFilterItemData<T>, queryTokens: string[]): SimpleFuzzyFilterMatchedItem<T> | null {
        const highlight = [] as SimpleFuzzyFilterHighlightItem[]
        const queryTokensMatched = {} as { [token: string]: boolean }
        let currentText = ''
        let lastMatchedToken: string = ''
        let isSameOrder = true

        item.text.forEach(text => {
            if (text.isToken) {
                let isTokenMatched = false
                let tokenPrev: string = ''

                queryTokens.forEach(token => {
                    if (!isTokenMatched) {
                        const indexOf = text.text.toUpperCase().indexOf(token)

                        if (indexOf == 0) {
                            if (lastMatchedToken != tokenPrev) {
                                isSameOrder = false
                            }

                            isTokenMatched = true
                            queryTokensMatched[token] = true

                            if (currentText) {
                                highlight.push({
                                    text: currentText,
                                    isMatched: false
                                })
                            }

                            highlight.push({
                                text: text.text.substr(0, token.length),
                                isMatched: true
                            })

                            highlight.push({
                                text: text.text.substr(token.length),
                                isMatched: false
                            })

                            currentText = ''
                            lastMatchedToken = token
                        }
                    }

                    tokenPrev = token
                })

                if (!isTokenMatched) {
                    highlight.push({
                        text: currentText + text.text,
                        isMatched: false
                    })

                    currentText = ''
                }
            } else {
                currentText += text.text
            }
        })

        if (currentText) {
            highlight.push({
                text: currentText,
                isMatched: false
            })
        }

        if (Object.keys(queryTokensMatched).length == queryTokens.length) {
            return {
                item: item.item,
                highlight: highlight,
                isSameOrder: isSameOrder
            }
        } else {
            return null
        }
    }
}
