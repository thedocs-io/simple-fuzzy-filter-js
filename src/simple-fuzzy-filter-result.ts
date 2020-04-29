
export type SimpleFuzzyFilterHighlightItem = {
    text: string;
    isMatched: boolean;
};

export type SimpleFuzzyFilterHighlightResultList = SimpleFuzzyFilterHighlightItem[][];

export type SimpleFuzzyFilterHighlightResultMap = { [key: string]: SimpleFuzzyFilterHighlightItem[] };

export class SimpleFuzzyFilterHighlightResult {
    single: SimpleFuzzyFilterHighlightItem[];
    list: SimpleFuzzyFilterHighlightResultList;
    map: SimpleFuzzyFilterHighlightResultMap;

    constructor(single: SimpleFuzzyFilterHighlightItem[] | null, list: SimpleFuzzyFilterHighlightItem[][] | null, map: SimpleFuzzyFilterHighlightResultMap | null) {
        this.single = single!;
        this.list = list!;
        this.map = map!;
    }

    isSingle(): boolean {
        return  this.single != null;
    }

    isList(): boolean {
        return this.list != null;
    }

    isMap(): boolean {
        return this.map != null;
    }
}

export type SimpleFuzzyFilterMatchedItem<T> = {
    item: T;
    highlight: SimpleFuzzyFilterHighlightResult;
    isSameOrder: boolean
}
