export type SimpleFuzzyFilterTokenizedItem = {
    text: string;
    isToken: boolean;
}

export class SimpleFuzzyFilterTokenizer {

    private splitSymbols: string[];
    private splitByCase: boolean;

    constructor(splitSymbols?: string[], splitByCase?: boolean) {
        this.splitSymbols = splitSymbols || [" ", "\t",".", "-", "_", ","];
        this.splitByCase = splitByCase || true;
    }

    tokenize(text: string): SimpleFuzzyFilterTokenizedItem[] {
        const answer = [] as SimpleFuzzyFilterTokenizedItem[];
        const spittedText = text.split("");
        let currentToken = '';
        let prevTokenByCase = false;

        const saveToken = function (token: string) {
            if (token) answer.push({
                text: token,
                isToken: true
            });
        };

        spittedText.forEach(letter => {
            if (this.splitSymbols.indexOf(letter) != -1) {
                saveToken(currentToken);
                currentToken = "";

                answer.push({
                    text: letter,
                    isToken: false
                });

                prevTokenByCase = false;
            } else if (this.splitByCase && letter.toUpperCase() == letter) {
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
