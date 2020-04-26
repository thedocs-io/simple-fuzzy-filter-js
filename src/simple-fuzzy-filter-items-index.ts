import 'core-js/features/array/for-each';
import 'core-js/features/array/find';
import {SimpleFuzzyFilterTokenizedItem, SimpleFuzzyFilterTokenizer} from "./simple-fuzzy-filter-tokenizer";
import {SimpleFuzzyFilterItemText, SimpleFuzzyFilterItemTextProvider} from "./simple-fuzzy-filter";

export enum SimpleFuzzyFilterItemTextType {
    SINGLE, ARRAY, OBJECT
}

export type SimpleFuzzyFilterItemData<T> = {
    item: T;
    textTokenized: { [key: string]: SimpleFuzzyFilterTokenizedItem[] };
    textType: SimpleFuzzyFilterItemTextType;
}

export class SimpleFuzzyFilterItemsIndex<T> {

    private items_: SimpleFuzzyFilterItemData<T>[] | null;
    private textProvider: SimpleFuzzyFilterItemTextProvider<T>;
    private tokenizer: SimpleFuzzyFilterTokenizer;
    private itemsCached: T[];

    constructor(
        textProvider: SimpleFuzzyFilterItemTextProvider<T>,
        tokenizer: SimpleFuzzyFilterTokenizer,
        itemsCached: T[]
    ) {
        this.textProvider = textProvider;
        this.tokenizer = tokenizer;
        this.itemsCached = [];
        this.items_ = null;

        itemsCached.forEach(item => this.itemsCached.push(item));
    }

    get items(): T[] {
        if (this.items_) {
            return this.items_.map(i => i.item);
        } else {
            return this.itemsCached.map(i => i);
        }
    }

    get indexedItems(): SimpleFuzzyFilterItemData<T>[] {
        if (!this.items_) {
            this.items_ = this.initIndex();
        }

        return this.items_;
    }

    set(items: T[]): void {
        this.reset();
        this.addAll(items);
    }

    reset(): void {
        if (this.items_) this.items_.length = 0;
        if (this.itemsCached) this.itemsCached.length = 0;
    }

    add(item: T): void {
        if (this.items_) {
            const textOriginal = this.textProvider(item);
            const textType = this.getTextType(textOriginal);
            const textTokenized = this.tokenize(textOriginal, textType);

            this.items_.push({
                item: item,
                textTokenized: textTokenized,
                textType: textType
            });
        } else {
            this.itemsCached.push(item);
        }
    }

    addAll(items: T[]): void {
        items.forEach(item => this.add(item));
    }

    remove(item: T): void {
        if (this.items_) {
            const itemIndexed = this.items_.find(i => i.item == item);

            if (itemIndexed) {
                this.items_.splice(this.items_.indexOf(itemIndexed), 1);
            }
        } else {
            const index = this.itemsCached.indexOf(item);

            if (index) {
                this.itemsCached.splice(index, 1);
            }
        }
    }

    removeAll(items: T[]): void {
        items.forEach(item => this.remove(item));
    }

    initIndex(): SimpleFuzzyFilterItemData<T>[] {
        this.items_ = [];
        this.itemsCached.forEach(item => this.add(item));
        this.itemsCached = [];

        return this.items_;
    }

    private getTextType(text: SimpleFuzzyFilterItemText): SimpleFuzzyFilterItemTextType {
        if (Array.isArray(text)) {
            return SimpleFuzzyFilterItemTextType.ARRAY;
        } else if (typeof text === 'string' || text instanceof String) {
            return SimpleFuzzyFilterItemTextType.SINGLE;
        } else {
            return SimpleFuzzyFilterItemTextType.OBJECT;
        }
    }

    private tokenize(text: SimpleFuzzyFilterItemText, textType: SimpleFuzzyFilterItemTextType): { [key: string]: SimpleFuzzyFilterTokenizedItem[] } {
        const answer: { [key: string]: SimpleFuzzyFilterTokenizedItem[] } = {};

        if (textType == SimpleFuzzyFilterItemTextType.SINGLE) {
            answer["a0"] = this.tokenizer.tokenize(text as string);
        } else if (textType == SimpleFuzzyFilterItemTextType.ARRAY) {
            (text as string[]).forEach((textItem, i) => {
                answer["a" + i] = this.tokenizer.tokenize(textItem);
            });
        } else {
            Object.keys(text as { [key: string]: string }).forEach(key => {
                answer[key] = this.tokenizer.tokenize((text as { [key: string]: string })[key] as string);
            });
        }

        return answer;
    }
}
