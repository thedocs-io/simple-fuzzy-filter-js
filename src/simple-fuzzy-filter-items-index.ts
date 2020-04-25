import 'core-js/features/array/for-each'
import 'core-js/features/array/find'
import { SimpleFuzzyFilterTokenizedItem, SimpleFuzzyFilterTokenizer } from './simple-fuzzy-filter-tokenizer'
import { SimpleFuzzyFilterItemTextProvider } from './simple-fuzzy-filter-js'

export type SimpleFuzzyFilterItemData<T> = {
    item: T
    text: SimpleFuzzyFilterTokenizedItem[]
}

export class SimpleFuzzyFilterItemsIndex<T> {
    private items_: SimpleFuzzyFilterItemData<T>[] | null
    private textProvider: SimpleFuzzyFilterItemTextProvider<T>
    private tokenizer: SimpleFuzzyFilterTokenizer
    private itemsCached: T[]

    constructor(textProvider: SimpleFuzzyFilterItemTextProvider<T>, tokenizer: SimpleFuzzyFilterTokenizer, itemsCached: T[]) {
        this.textProvider = textProvider
        this.tokenizer = tokenizer
        this.itemsCached = [...itemsCached]
        this.items_ = null
    }

    get items(): T[] {
        if (this.items_) {
            return this.items_.map(i => i.item)
        } else {
            return [...this.itemsCached]
        }
    }

    get indexedItems(): SimpleFuzzyFilterItemData<T>[] {
        if (!this.items_) {
            this.items_ = this.initIndex()
        }

        return this.items_
    }

    add(item: T): void {
        if (this.items_) {
            this.items_.push({
                item: item,
                text: this.tokenizer.tokenize(this.textProvider(item))
            })
        } else {
            this.itemsCached.push(item)
        }
    }

    addAll(items: T[]): void {
        items.forEach(item => this.add(item))
    }

    remove(item: T): void {
        if (this.items_) {
            const itemIndexed = this.items_.find(i => i.item == item)

            if (itemIndexed) {
                this.items_.splice(this.items_.indexOf(itemIndexed), 1)
            }
        } else {
            const index = this.itemsCached.indexOf(item)

            if (index) {
                this.itemsCached.splice(index, 1)
            }
        }
    }

    removeAll(items: T[]): void {
        items.forEach(item => this.remove(item))
    }

    initIndex(): SimpleFuzzyFilterItemData<T>[] {
        this.items_ = []
        this.itemsCached.forEach(item => this.add(item))
        this.itemsCached = []

        return this.items_
    }
}
