import SimpleFuzzyFilter, {SimpleFuzzyFilterHighlightItem, SimpleFuzzyFilterInitConfig} from "../src/simple-fuzzy-filter"

type Note = {
    key: string
}

type DataSetToCheck = {
    keys: string[],
    query: string,
    expect: {
        highlight: string,
        isSameOrder?: boolean
    }[]
}

describe("SimpleFuzzyFilter test", () => {

    const assert = (dataSetToCheck: DataSetToCheck, config?: SimpleFuzzyFilterInitConfig<Note>) => {
        const notes = dataSetToCheck.keys.map(key => {
            return {key: key}
        }) as Note[];

        config = config || {} as SimpleFuzzyFilterInitConfig<Note>;
        config.items = notes;
        config.textProvider = item => item.key;

        const filter = new SimpleFuzzyFilter<Note>(config);

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

        const query = dataSetToCheck.query;
        const answer = filter.filter(query);

        expect(
            query + ":" + answer.map(item => highlight(item.highlight as SimpleFuzzyFilterHighlightItem[]) + ":" + item.isSameOrder).join(", ")
        ).toBe(
            query + ":" + dataSetToCheck.expect.map(item => item.highlight + ":" + ((item.isSameOrder == null) ? true : item.isSameOrder)).join(", ")
        );
    };

    it("query not matches: simple case", () => {
        const itemsToCheck = [
            {
                keys: ["hello world"],
                query: "hellow",
                expect: []
            },
            {
                keys: ["hello world"],
                query: "word",
                expect: []
            },
            {
                keys: ["helloworld"],
                query: "hello world",
                expect: []
            },
            {
                keys: ["helloWorld"],
                query: "helloworld",
                expect: []
            },
            {
                keys: ["helloWorld"],
                query: "hel orld",
                expect: []
            },
            {
                keys: ["helloWorld"],
                query: "l",
                expect: []
            },
            {
                keys: ["hello world"],
                query: "hello again",
                expect: []
            },
            {
                keys: ["hello world"],
                query: "justWord",
                expect: []
            },
            {
                keys: ["hello world"],
                query: "ello world",
                expect: []
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item);
        })
    });

    it("query matches: single word", () => {
        const itemsToCheck = [
            {
                keys: ["hello world"],
                query: "hel",
                expect: [{highlight: "[hel]lo world"}]
            },
            {
                keys: ["hello world"],
                query: "Hel",
                expect: [{highlight: "[hel]lo world"}]
            },
            {
                keys: ["helloworld"],
                query: "hel",
                expect: [{highlight: "[hel]loworld"}]
            },
            {
                keys: ["helloWorld"],
                query: "hel",
                expect: [{highlight: "[hel]loWorld"}]
            },
            {
                keys: ["helloWorld"],
                query: "hel",
                expect: [{highlight: "[hel]loWorld"}]
            },
            {
                keys: ["helloWorld"],
                query: "hello",
                expect: [{highlight: "[hello]World"}]
            },
            {
                keys: ["helloWorld"],
                query: "wo",
                expect: [{highlight: "hello[Wo]rld"}]
            },
            {
                keys: ["hello-world"],
                query: "wo",
                expect: [{highlight: "hello-[wo]rld"}]
            },
            {
                keys: ["hello world"],
                query: "wo",
                expect: [{highlight: "hello [wo]rld"}]
            },
            {
                keys: ["HELLO WORLD"],
                query: "hel",
                expect: [{highlight: "[HEL]LO WORLD"}]
            },
            {
                keys: ["HELLO_WORLD"],
                query: "hel",
                expect: [{highlight: "[HEL]LO_WORLD"}]
            },
            {
                keys: ["HELLO-WORLD"],
                query: "wo",
                expect: [{highlight: "HELLO-[WO]RLD"}]
            },
            {
                keys: ["HELLO-WORLD"],
                query: "world",
                expect: [{highlight: "HELLO-[WORLD]"}]
            },
            {
                keys: ["helloWorld"],
                query: "HELLO",
                expect: [{highlight: "[hello]World"}]
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item);
        })
    });

    it("query matches: multiple words", () => {
        const itemsToCheck = [
            {
                keys: ["hello world"],
                query: "hel wor",
                expect: [{highlight: "[hel]lo [wor]ld"}]
            },
            {
                keys: ["hello world"],
                query: "helWor",
                expect: [{highlight: "[hel]lo [wor]ld"}]
            },
            {
                keys: ["hello world"],
                query: "HelWor",
                expect: [{highlight: "[hel]lo [wor]ld"}]
            },
            {
                keys: ["hello world"],
                query: "hel-Wor",
                expect: [{highlight: "[hel]lo [wor]ld"}]
            },
            {
                keys: ["hello world"],
                query: "hel-World",
                expect: [{highlight: "[hel]lo [world]"}]
            },
            {
                keys: ["HELLO world"],
                query: "Hel WORLD",
                expect: [{highlight: "[HEL]LO [world]"}]
            },
            {
                keys: ["HELLO_world"],
                query: "Hel_WORLD",
                expect: [{highlight: "[HEL]LO_[world]"}]
            },
            {
                keys: ["HELLO_World"],
                query: "Hel_WORLD",
                expect: [{highlight: "[HEL]LO_[World]"}]
            },
            {
                keys: ["hello world again"],
                query: "hel wor-again",
                expect: [{highlight: "[hel]lo [wor]ld [again]"}]
            },

            {
                keys: ["hello world"],
                query: "wor hel",
                expect: [{highlight: "[hel]lo [wor]ld", isSameOrder: false}]
            },
            {
                keys: ["hello world"],
                query: "worHel",
                expect: [{highlight: "[hel]lo [wor]ld", isSameOrder: false}]
            },
            {
                keys: ["hello world"],
                query: "WorHel",
                expect: [{highlight: "[hel]lo [wor]ld", isSameOrder: false}]
            },
            {
                keys: ["hello world"],
                query: "wor-Hel",
                expect: [{highlight: "[hel]lo [wor]ld", isSameOrder: false}]
            },
            {
                keys: ["hello world"],
                query: "world-Hel",
                expect: [{highlight: "[hel]lo [world]", isSameOrder: false}]
            },
            {
                keys: ["HELLO world"],
                query: "World HEL",
                expect: [{highlight: "[HEL]LO [world]", isSameOrder: false}]
            },
            {
                keys: ["HELLO_world"],
                query: "World_HEL",
                expect: [{highlight: "[HEL]LO_[world]", isSameOrder: false}]
            },
            {
                keys: ["HELLO_World"],
                query: "World_HELLO",
                expect: [{highlight: "[HELLO]_[World]", isSameOrder: false}]
            },
            {
                keys: ["HELLO_World_again"],
                query: "World-aga_HELLO",
                expect: [{highlight: "[HELLO]_[World]_[aga]in", isSameOrder: false}]
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item);
        })
    });

    it("query matches: same order first", () => {
        const itemsToCheck = [
            {
                keys: ["hello world", "world hello"],
                query: "hel wor",
                expect: [{highlight: "[hel]lo [wor]ld"}, {highlight: "[wor]ld [hel]lo", isSameOrder: false}]
            },
            {
                keys: ["hello world", "world hello"],
                query: "worHel",
                expect: [{highlight: "[wor]ld [hel]lo"}, {highlight: "[hel]lo [wor]ld", isSameOrder: false}]
            },
            {
                keys: ["hello planet mars", "world hello", "another abchello", "planet earth, hello"],
                query: "hello",
                expect: [{highlight: "[hello] planet mars"}, {highlight: "world [hello]"}, {highlight: "planet earth, [hello]"}]
            },
            {
                keys: ["hello planet mars", "world hello", "another abchello", "planet earth, hello"],
                query: "hello-Plan",
                expect: [{highlight: "[hello] [plan]et mars"}, {highlight: "[plan]et earth, [hello]", isSameOrder: false}]
            },
            {
                keys: ["hello planet mars", "world hello", "another abchello", "planet earth, hello"],
                query: "plan, hello",
                expect: [{highlight: "[plan]et earth, [hello]"}, {highlight: "[hello] [plan]et mars", isSameOrder: false}]
            }
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item, {filter: {isSameOrderFirst: true}} as SimpleFuzzyFilterInitConfig<Note>);
        })
    });

    it("query matches: missing words", () => {
        const itemsToCheck = [
            {
                keys: ["hello world again"],
                query: "hel wor",
                expect: [{highlight: "[hel]lo [wor]ld again"}]
            },
        ] as DataSetToCheck[];

        itemsToCheck.forEach(item => {
            assert(item);
        })
    });

});
