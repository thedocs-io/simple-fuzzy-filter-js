import SimpleFuzzyFilter, {SimpleFuzzyFilterHighlightItem} from "../src/simple-fuzzy-filter-js"

type Note = {
    key: string
}

type DataSetToCheck = {
    keys: string[], query: string, highlightExpected: string;
}

describe("SimpleFuzzyFilter test", () => {

    const assert = (keys: string[], query: string, highlightExpected: string) => {
        const notes = keys.map(key => {
            return {key: key}
        }) as Note[];

        const filter = new SimpleFuzzyFilter<Note>({
            items: notes,
            textProvider: item => item.key,
        });

        const highlight = (items: SimpleFuzzyFilterHighlightItem[]) => {
            let answer = "";

            items.forEach(item => {
                if (item.isMatched) {
                    answer += "[" + item.text + "]";
                } else {
                    answer += item.text;
                }
            });

            return answer;
        };

        expect(query + ":" + filter.filterAndHighlight(query).map(item => highlight(item.highlight)).join(", ")).toBe(query + ":" + highlightExpected);
    };

    it("query not matches: simple case", () => {
        const itemsToCheck = [
            {
                keys: ["hello world"],
                query: "hellow",
                highlightExpected: ""
            },
            {
                keys: ["hello world"],
                query: "word",
                highlightExpected: ""
            },
            {
                keys: ["helloworld"],
                query: "hello world",
                highlightExpected: ""
            },
            {
                keys: ["helloWorld"],
                query: "helloworld",
                highlightExpected: ""
            },
            {
                keys: ["helloWorld"],
                query: "hel orld",
                highlightExpected: ""
            },
            {
                keys: ["helloWorld"],
                query: "l",
                highlightExpected: ""
            },
            {
                keys: ["hello world"],
                query: "hello again",
                highlightExpected: ""
            },
            {
                keys: ["hello world"],
                query: "justWord",
                highlightExpected: ""
            },
            {
                keys: ["hello world"],
                query: "ello world",
                highlightExpected: ""
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item.keys, item.query, item.highlightExpected);
        })
    });

    it("query matches: single word", () => {
        const itemsToCheck = [
            {
                keys: ["hello world"],
                query: "hel",
                highlightExpected: "[hel]lo world"
            },
            {
                keys: ["hello world"],
                query: "Hel",
                highlightExpected: "[hel]lo world"
            },
            {
                keys: ["helloworld"],
                query: "hel",
                highlightExpected: "[hel]loworld"
            },
            {
                keys: ["helloWorld"],
                query: "hel",
                highlightExpected: "[hel]loWorld"
            },
            {
                keys: ["helloWorld"],
                query: "hel",
                highlightExpected: "[hel]loWorld"
            },
            {
                keys: ["helloWorld"],
                query: "hello",
                highlightExpected: "[hello]World"
            },
            {
                keys: ["helloWorld"],
                query: "wo",
                highlightExpected: "hello[Wo]rld"
            },
            {
                keys: ["hello-world"],
                query: "wo",
                highlightExpected: "hello-[wo]rld"
            },
            {
                keys: ["hello world"],
                query: "wo",
                highlightExpected: "hello [wo]rld"
            },
            {
                keys: ["HELLO WORLD"],
                query: "hel",
                highlightExpected: "[HEL]LO WORLD"
            },
            {
                keys: ["HELLO_WORLD"],
                query: "hel",
                highlightExpected: "[HEL]LO_WORLD"
            },
            {
                keys: ["HELLO-WORLD"],
                query: "wo",
                highlightExpected: "HELLO-[WO]RLD"
            },
            {
                keys: ["HELLO-WORLD"],
                query: "world",
                highlightExpected: "HELLO-[WORLD]"
            },
            {
                keys: ["helloWorld"],
                query: "HELLO",
                highlightExpected: "[hello]World"
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item.keys, item.query, item.highlightExpected);
        })
    });

    it("query matches: multiple words", () => {
        const itemsToCheck = [
            {
                keys: ["hello world"],
                query: "hel wor",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "helWor",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "HelWor",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "hel-Wor",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "hel-World",
                highlightExpected: "[hel]lo [world]"
            },
            {
                keys: ["HELLO world"],
                query: "Hel WORLD",
                highlightExpected: "[HEL]LO [world]"
            },
            {
                keys: ["HELLO_world"],
                query: "Hel_WORLD",
                highlightExpected: "[HEL]LO_[world]"
            },
            {
                keys: ["HELLO_World"],
                query: "Hel_WORLD",
                highlightExpected: "[HEL]LO_[World]"
            },
            {
                keys: ["hello world again"],
                query: "hel wor-again",
                highlightExpected: "[hel]lo [wor]ld [again]"
            },

            {
                keys: ["hello world"],
                query: "wor hel",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "worHel",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "WorHel",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "wor-Hel",
                highlightExpected: "[hel]lo [wor]ld"
            },
            {
                keys: ["hello world"],
                query: "world-Hel",
                highlightExpected: "[hel]lo [world]"
            },
            {
                keys: ["HELLO world"],
                query: "World HEL",
                highlightExpected: "[HEL]LO [world]"
            },
            {
                keys: ["HELLO_world"],
                query: "World_HEL",
                highlightExpected: "[HEL]LO_[world]"
            },
            {
                keys: ["HELLO_World"],
                query: "World_HELLO",
                highlightExpected: "[HELLO]_[World]"
            },
            {
                keys: ["HELLO_World_again"],
                query: "World-aga_HELLO",
                highlightExpected: "[HELLO]_[World]_[aga]in"
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item.keys, item.query, item.highlightExpected);
        })
    });

    it("query matches: missing words", () => {
        const itemsToCheck = [
            {
                keys: ["hello world again"],
                query: "hel wor",
                highlightExpected: "[hel]lo [wor]ld again"
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item.keys, item.query, item.highlightExpected);
        })
    });

});
