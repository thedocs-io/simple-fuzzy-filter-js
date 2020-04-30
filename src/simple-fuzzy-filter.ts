import 'core-js/features/array/map';
import 'core-js/features/array/for-each';
import {SimpleFuzzyFilterTokenizedItem, SimpleFuzzyFilterTokenizer} from "./simple-fuzzy-filter-tokenizer";
import {SimpleFuzzyFilterItemData, SimpleFuzzyFilterItemsIndex, SimpleFuzzyFilterItemTextType} from "./simple-fuzzy-filter-items-index";
import {SimpleFuzzyFilterHighlightItem, SimpleFuzzyFilterHighlightResult, SimpleFuzzyFilterMatchedItem} from "./simple-fuzzy-filter-result";

export type SimpleFuzzyFilterItemText = string | string[] | { [key: string]: string };

export type SimpleFuzzyFilterItemTextProvider<T> = (item: T) => SimpleFuzzyFilterItemText;

export type SimpleFuzzyFilterInitConfig<T> = {
    textProvider: SimpleFuzzyFilterItemTextProvider<T>,
    items?: T[];
    initIndexOn?: "construct" | "first-filter";
    tokenizer?: {
        splitSymbols?: string[],
        isSplitByCase?: boolean
    },
    filter?: {
        isSameOrderFirst?: boolean,
        isSameOrderStrict?: boolean
    }
}

export default class SimpleFuzzyFilter<T> {

    private textProvider: SimpleFuzzyFilterItemTextProvider<T>;
    private tokenizer: SimpleFuzzyFilterTokenizer;
    private index_: SimpleFuzzyFilterItemsIndex<T>;
    private config: SimpleFuzzyFilterInitConfig<T>;

    constructor(config: SimpleFuzzyFilterInitConfig<T>) {
        config.tokenizer = config.tokenizer || {};

        this.config = config;
        this.textProvider = config.textProvider;
        this.tokenizer = new SimpleFuzzyFilterTokenizer(config.tokenizer.splitSymbols, config.tokenizer.isSplitByCase);
        this.index_ = new SimpleFuzzyFilterItemsIndex<T>(this.textProvider, this.tokenizer, config.items || []);


        if (config.initIndexOn == "construct") {
            this.index_.indexedItems;
        }
    }

    get index(): SimpleFuzzyFilterItemsIndex<T> {
        return this.index_;
    }

    filter(query: string): SimpleFuzzyFilterMatchedItem<T>[] {
        return this.doFilter(query);
    }

    private doFilter(query: string): SimpleFuzzyFilterMatchedItem<T>[] {
        const answer = [] as SimpleFuzzyFilterMatchedItem<T>[];
        const answerRandomOrder = [] as SimpleFuzzyFilterMatchedItem<T>[];
        const queryTokens = this.getQueryTokens(query);
        const items = this.index_.indexedItems;

        items.forEach(item => {
            const matched = this.doFilterItem(item, queryTokens);

            if (matched) {
                if (matched.isSameOrder) {
                    answer.push(matched);
                } else {
                    if (!this.config.filter?.isSameOrderStrict) {
                        if (this.config.filter?.isSameOrderFirst) {
                            answerRandomOrder.push(matched);
                        } else {
                            answer.push(matched);
                        }
                    }
                }
            }
        });

        answerRandomOrder.forEach(item => answer.push(item));

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

    private doFilterItem(item: SimpleFuzzyFilterItemData<T>, queryTokens: string[]): SimpleFuzzyFilterMatchedItem<T> | null {
        const queryTokensMatched: { [token: string]: boolean } = {};
        const queryTokensLength = queryTokens.length;

        let isAnySameOrder = false;
        let highlight: { [key: string]: SimpleFuzzyFilterHighlightItem[] } = {};

        Object.keys(item.textTokenized).forEach(key => {
            const filterResult = this.doFilterItemTokenizedText(item.textTokenized[key], queryTokens);
            let queryTokensMatchedCount = 0;

            filterResult.queryTokensMatched.forEach(token => {
                queryTokensMatched[token] = true;
                queryTokensMatchedCount++;
            });

            if (filterResult.isSameOrder && queryTokensLength == queryTokensMatchedCount) {
                isAnySameOrder = true;
            }

            highlight[key] = filterResult.highlight;
        });

        if (Object.keys(queryTokensMatched).length == queryTokensLength) {
            return {
                item: item.item,
                isSameOrder: isAnySameOrder,
                highlight: this.getHighlightResult(highlight, item.textType)
            }
        } else {
            return null;
        }
    }

    private doFilterItemTokenizedText(tokenizedText: SimpleFuzzyFilterTokenizedItem[], queryTokens: string[]): { queryTokensMatched: string[], highlight: SimpleFuzzyFilterHighlightItem[], isSameOrder: boolean } {
        const highlight = [] as SimpleFuzzyFilterHighlightItem[];
        const queryTokensMatched = {} as { [token: string]: boolean };
        let currentText = "";
        let lastMatchedToken: string = "";
        let isSameOrder = true;

        tokenizedText.forEach(text => {
            if (text.isToken) {
                let isTokenMatched = false;
                let tokenPrev: string = "";

                queryTokens.forEach(token => {
                    if (!isTokenMatched) {
                        const indexOf = text.text.toUpperCase().indexOf(token);

                        if (indexOf == 0) {
                            if (lastMatchedToken != tokenPrev) {
                                isSameOrder = false;
                            }

                            isTokenMatched = true;
                            queryTokensMatched[token] = true;

                            if (currentText) {
                                highlight.push({
                                    text: currentText,
                                    isMatched: false
                                });
                            }

                            highlight.push({
                                text: text.text.substr(0, token.length),
                                isMatched: true
                            });

                            highlight.push({
                                text: text.text.substr(token.length),
                                isMatched: false
                            });

                            currentText = "";
                            lastMatchedToken = token;
                        }
                    }

                    tokenPrev = token;
                });

                if (!isTokenMatched) {
                    highlight.push({
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
            highlight.push({
                text: currentText,
                isMatched: false
            });
        }

        return {
            queryTokensMatched: Object.keys(queryTokensMatched),
            isSameOrder: isSameOrder,
            highlight: highlight,
        };
    }

    private getHighlightResult(highlight: { [key: string]: SimpleFuzzyFilterHighlightItem[] }, textType: SimpleFuzzyFilterItemTextType): SimpleFuzzyFilterHighlightResult {
        const keys = Object.keys(highlight);

        if (textType == SimpleFuzzyFilterItemTextType.SINGLE) {
            return new SimpleFuzzyFilterHighlightResult(highlight[keys[0]], null, null);
        } else if (textType == SimpleFuzzyFilterItemTextType.LIST) {
            return new SimpleFuzzyFilterHighlightResult(null, keys.map(key => highlight[key]), null);
        } else {
            const answer: { [key: string]: SimpleFuzzyFilterHighlightItem[] } = {};

            keys.forEach(key => {
                answer[key] = highlight[key];
            });

            return new SimpleFuzzyFilterHighlightResult(null, null, answer);
        }
    }
}
