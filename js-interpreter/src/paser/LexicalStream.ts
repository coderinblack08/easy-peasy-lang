export enum TokenType {
  StringLiteral = "str",
  Identifier = "id",
  Keyword = "kw",
  Punc = "punc",
  Op = "op",
  Int = "int",
  Float = "float",
  // Boolean = "bool",
  // Nil = "nil",
}

/**
 * Token
 * @class
 * @classdesc Basic token class
 */
export class Token {
  type: TokenType;
  value: string;

  constructor(type: TokenType, value: any) {
    this.type = type;
    this.value = value;
  }
}

/**
 * LexicalStream
 * @class
 * @classdesc LexicalStream receives and parses a string of characters and returns a list of tokens.
 */
export class LexicalStream {
  pos = 0;
  line = 0;
  col = 0;

  currToken: Token | null;

  static validKeywords = [
    // Conditionals
    "if",
    "else",
    "elif",
    "end",
    "and",
    "or",
    "not",
    // Loops
    "while",
    "for",
    "break",
    // Sprites and functions
    "func",
    "sprite",
    "return",
    // Should these be keywords?
    // ...eh, I'll reconsider later
    "True",
    "False",
    "nil",
  ];

  /**
   * @param source - program to be parsed
   */
  constructor(private readonly source: string) {}

  // 💡 Group 1: private input stream helpers
  private eofRaw() {
    // charAt returns "" when out of bounds
    return this.peekRaw() === "";
  }

  private peekRaw(): string {
    return this.source.charAt(this.pos);
  }

  private previousRaw(): string {
    if (this.pos === 0) return "";
    return this.source.charAt(this.pos - 1);
  }

  private nextRaw(): string {
    const nextChar = this.source.charAt(this.pos++);
    if (nextChar === "\n") {
      this.line++, (this.col = 0);
    } else {
      this.col++;
    }
    return nextChar;
  }

  // 🔨 Group 2: tokenizer helpers
  public static isWhiteSpace(char: string) {
    return /\s/.test(char);
  }

  public static isNumber(char: string) {
    // aims to work with floats and integers
    return /[0-9]/.test(char) || char === ".";
  }

  public static isIdentifierStart(char: string) {
    return /[a-zA-Z_]/.test(char);
  }

  public static isIdentifierRest(char: string) {
    return /[a-zA-Z0-9_]/.test(char);
  }

  public static isKeyword(char: string) {
    return LexicalStream.validKeywords.includes(char);
  }

  public static isOperator(char: string) {
    return /[+\-*/%<>=!&|^~]/.test(char);
  }

  public static isPunctuation(char: string) {
    return /[{}()[\].,:;]/.test(char);
  }

  // 🔨 Group 3: token builders
  private readWhile(predicate: (char: string) => boolean): string[] {
    let char = this.peekRaw();
    const accumulation = [];
    while (predicate(char)) {
      accumulation.push(char);
      char = this.nextRaw();
    }
    return accumulation;
  }

  private readNumber(): Token {
    const number = this.readWhile(LexicalStream.isNumber);
    const combined = number.join("");
    const dotCount = combined.match(/\./g)?.length ?? 0;
    if (dotCount >= 1) {
      if (dotCount === 1 && combined.at(0) !== "." && combined.at(-1) !== ".") {
        return new Token(TokenType.Float, Number.parseFloat(combined));
      } else {
        throw new SyntaxError("Invalid float");
      }
    } else {
      return new Token(TokenType.Int, Number.parseInt(combined, 10));
    }
  }

  /**
   * @todo - make this more robust to catch invalid operators
   */
  private readOperator(): Token {
    const operator = this.readWhile(LexicalStream.isOperator);
    return new Token(TokenType.Op, operator.join(""));
  }

  private readString(): Token {
    // skip the opening and closing quotes, get bulk of string
    this.nextRaw();
    // accounts for escaped quotes
    const string = this.readWhile(
      (char) => char !== '"' && this.previousRaw() !== "\\"
    );
    this.nextRaw();
    return new Token(TokenType.StringLiteral, string.join(""));
  }

  private readIdentifier(): Token {
    const identifier = this.readWhile(LexicalStream.isIdentifierRest).join("");
    return new Token(
      LexicalStream.isKeyword(identifier)
        ? TokenType.Keyword
        : TokenType.Identifier,
      identifier
    );
  }

  private skipComment() {
    this.readWhile((char) => char !== "\n");
    this.nextRaw();
  }

  public readNext(): Token | null {
    this.readWhile(LexicalStream.isWhiteSpace);
    if (this.eofRaw()) return null;
    const char = this.peekRaw();
    if (char === "#") {
      this.skipComment();
      return this.readNext();
    }
    if (char == '"') {
      return this.readString();
    }
    // important for punctuation to go before number due to floats
    if (LexicalStream.isPunctuation(char)) {
      return new Token(TokenType.Punc, this.nextRaw());
    }
    if (LexicalStream.isIdentifierStart(char)) {
      return this.readIdentifier();
    }
    if (LexicalStream.isNumber(char)) {
      return this.readNumber();
    }
    if (LexicalStream.isOperator(char)) {
      return this.readOperator();
    }
    throw new SyntaxError(`Unexpected character: ${char}`);
  }

  // 🎏 Group 4: accessible token stream

  public peek() {
    return this.currToken || (this.currToken = this.readNext());
  }

  public next() {
    const token = this.peek();
    this.currToken = this.readNext();
    return token;
  }

  public eof() {
    return this.peek() === null;
  }
}
