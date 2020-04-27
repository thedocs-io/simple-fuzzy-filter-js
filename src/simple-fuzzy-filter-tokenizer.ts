export type SimpleFuzzyFilterTokenizedItem = {
    text: string;
    isToken: boolean;
}

export class SimpleFuzzyFilterTokenizer {

    private splitSymbols: string[];
    private isSplitByCase: boolean;

    constructor(splitSymbols?: string[], isSplitByCase?: boolean) {
        this.splitSymbols = splitSymbols || [" ", "\t", ".", "-", "_", ","];
        this.isSplitByCase = isSplitByCase || true;
    }

    tokenize(text: string): SimpleFuzzyFilterTokenizedItem[] {
        const answer = [] as SimpleFuzzyFilterTokenizedItem[];
        const letters = text.split("");
        let currentToken = '';
        let prevTokenByCase = false;

        const saveToken = function (token: string) {
            if (token) answer.push({
                text: token,
                isToken: true
            });
        };

        const saveSymbol = function (symbol: string) {
            if (symbol) answer.push({
                text: symbol,
                isToken: false
            });
        };

        letters.forEach(letter => {
            if (this.splitSymbols.indexOf(letter) != -1) {
                saveToken(currentToken);
                saveSymbol(letter);

                currentToken = "";
                prevTokenByCase = false;
            } else if (this.isSplitByCase && letter.toUpperCase() == letter) {
                if (prevTokenByCase) {
                    currentToken += letter;
                } else {
                    saveToken(currentToken);
                    currentToken = letter;
                    prevTokenByCase = true;
                }
            } else {
                currentToken += letter;
                prevTokenByCase = false;
            }
        });

        saveToken(currentToken);

        return answer;
    }

}
