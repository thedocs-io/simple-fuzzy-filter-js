import 'core-js/features/array/map';
import 'core-js/features/array/for-each';
import {SimpleFuzzyFilterTokenizer} from "./simple-fuzzy-filter-tokenizer";
import {
    SimpleFuzzyFilterItemData,
    SimpleFuzzyFilterItemsIndex
} from "./simple-fuzzy-filter-items-index";

export type SimpleFuzzyFilterItemTextProvider<T> = (item: T) => string;

export type SimpleFuzzyFilterHighlightItem = {
    text: string;
    isMatched: boolean;
}

export type SimpleFuzzyFilterMatchedItem<T> = {
    item: T;
    highlight: SimpleFuzzyFilterHighlightItem[]
}

export type SimpleFuzzyFilterFilterOptions = {
    highlight: boolean;
}

export type SimpleFuzzyFilterInitConfig<T> = {
    textProvider: SimpleFuzzyFilterItemTextProvider<T>,
    items?: T[];
    initIndexOn?: "construct" | "first-filter";
    tokenizer?: {
        splitSymbols?: string[],
        splitByCase?: boolean
    },
    filter?: {
        sameOrderFirst: boolean
    }
}

export default class SimpleFuzzyFilter<T> {

    private textProvider: SimpleFuzzyFilterItemTextProvider<T>;
    private tokenizer: SimpleFuzzyFilterTokenizer;
    private index: SimpleFuzzyFilterItemsIndex<T> | null;
    private itemsCached: T[];

    constructor(config: SimpleFuzzyFilterInitConfig<T>) {
        config.tokenizer = config.tokenizer || {};

        this.textProvider = config.textProvider;
        this.tokenizer = new SimpleFuzzyFilterTokenizer(config.tokenizer.splitSymbols, config.tokenizer.splitByCase);
        this.itemsCached = [...config.items || []];
        this.index = (config.initIndexOn == "construct") ? this.doInitIndex() : null;
    }

    filter(query: string): T[] {
        return this.doFilter(query).map(i => i.item);
    }

    filterAndHighlight(query: string): SimpleFuzzyFilterMatchedItem<T>[] {
        return this.doFilter(query);
    }

    add(item: T): void {
        if (this.index) {
            this.index.add(item);
        } else {
            this.itemsCached.push(item);
        }
    }

    addAll(items: T[]): void {
        items.forEach(item => this.add(item));
    }

    remove(item: T): void {
        if (this.index) {
            this.index.remove(item);
        } else {
            const index = this.itemsCached.indexOf(item);

            if (index >= 0) {
                this.itemsCached.splice(index, 1);
            }
        }
    }

    removeAll(items: T[]): void {
        items.forEach(item => this.remove(item));
    }

    private getIndex(): SimpleFuzzyFilterItemsIndex<T> {
        if (this.index == null) {
            return this.doInitIndex();
        } else {
            return this.index;
        }

    }

    private doInitIndex(): SimpleFuzzyFilterItemsIndex<T> {
        this.index = new SimpleFuzzyFilterItemsIndex<T>(this.textProvider, this.tokenizer);
        this.index.addAll(this.itemsCached);
        this.itemsCached = [];

        return this.index;
    }

    private doFilter(query: string): SimpleFuzzyFilterMatchedItem<T>[] {
        const answer = [] as SimpleFuzzyFilterMatchedItem<T>[];
        const queryTokens = this.getQueryTokens(query);
        const items = this.getIndex().items;

        items.forEach(item => {
            const matched = this.doFilterItem(item, queryTokens);

            if (matched) {
                answer.push({item: item.item, highlight: matched})
            }
        });

        return answer;
    }

    private getQueryTokens(query: string): string[] {
        const answer = [] as string[];
        const tokenizedItems = this.tokenizer.tokenize(query);

        tokenizedItems.forEach(item => {
            if (item.isToken) {
                answer.push(item.text.toUpperCase());
            }
        });

        return answer;
    }

    private doFilterItem(item: SimpleFuzzyFilterItemData<T>, queryTokens: string[]): SimpleFuzzyFilterHighlightItem[] | null {
        const answer = [] as SimpleFuzzyFilterHighlightItem[];
        const queryTokensMatched = {} as { [token: string]: boolean };
        let currentText = "";

        item.text.forEach(text => {
            if (text.isToken) {
                let isTokenMatched = false;

                queryTokens.forEach(token => {
                    if (!isTokenMatched) {
                        const indexOf = text.text.toUpperCase().indexOf(token);

                        if (indexOf == 0) {
                            isTokenMatched = true;
                            queryTokensMatched[token] = true;

                            if (currentText) {
                                answer.push({
                                    text: currentText,
                                    isMatched: false
                                });
                            }

                            answer.push({
                                text: text.text.substr(0, token.length),
                                isMatched: true
                            });

                            answer.push({
                                text: text.text.substr(token.length),
                                isMatched: false
                            });

                            currentText = "";
                        }
                    }
                });

                if (!isTokenMatched) {
                    answer.push({
                        text: currentText + text.text,
                        isMatched: false
                    });

                    currentText = "";
                }
            } else {
                currentText += text.text;
            }
        });

        if (currentText) {
            answer.push({
                text: currentText,
                isMatched: false
            });
        }

        if (Object.keys(queryTokensMatched).length == queryTokens.length) {
            return answer;
        } else {
            return null;
        }
    }
}
