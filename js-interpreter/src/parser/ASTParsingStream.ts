import { LexicalStream, OP_PRECEDENCE, TokenType } from "./LexicalStream";

/**
 * @class
 * @link https://www.youtube.com/watch?v=SToUyjAsaFk&ab_channel=hhp3
 * In the fashion of a [Recursive Descent Parser](https://en.wikipedia.org/wiki/Recursive_descent_parser)
 */
export class ASTParsingStream {
  constructor(private readonly stream: LexicalStream) {
    this.parseExpression = this.parseExpression.bind(this);
    this.parseAtom = this.parseAtom.bind(this);
    this.parseCall = this.parseCall.bind(this);
  }

  // Group 0: parses token stream into AST tree
  public parseTopLevel() {
    const prog = [];
    while (this.stream.hasNext()) {
      const exp = this.parseExpression();
      prog.push(exp);
      if (this.stream.hasNext()) this.skipPunctuation("\n");
    }
    return { type: "prog", body: prog };
  }

  // parse blocks similar to how we parse at the top level
  // use elif and else similar to end keyword
  private parseBlock(endKeywords = ["end"]) {
    const block = [];
    while (this.stream.hasNext()) {
      const current = this.stream.peek();
      if (
        current?.type === TokenType.Kw &&
        endKeywords.includes(current.value)
      ) {
        if (current.value === "end") this.stream.next();
        break;
      }
      block.push(this.parseExpression());
      if (this.stream.hasNext()) this.skipPunctuation("\n");
    }
    return block;
  }

  private parseExpressionOrBlock(endKeywords = ["end"]) {
    if (this.isPunctuation("\n")) {
      this.skipPunctuation("\n");
      return this.parseBlock(endKeywords);
    } else {
      return this.parseExpression();
    }
  }

  // Group 1: Utility functions
  private isPunctuation(punc?: string) {
    const token = this.stream.peek();
    return token &&
      token.type === TokenType.Punc &&
      (!punc || token.value === punc)
      ? token
      : null;
  }

  private isKeyword(keyword?: string) {
    const token = this.stream.peek();
    return token &&
      token.type === TokenType.Kw &&
      (!keyword || token.value === keyword)
      ? token
      : null;
  }

  private isOperation(op?: string) {
    const token = this.stream.peek();
    return token && token.type === TokenType.Op && (!op || token.value === op)
      ? token
      : null;
  }

  private skipKeyword(keyword: string) {
    if (this.isKeyword(keyword)) {
      this.stream.next();
    } else {
      throw new SyntaxError(`Expected keyword ${keyword}`);
    }
  }

  private skipPunctuation(punc: string) {
    if (this.isPunctuation(punc)) {
      this.stream.next();
    } else {
      throw new SyntaxError(`Expected punctuation ${punc}`);
    }
  }

  // Group 2: Parsers
  private parseByDelimiter(
    start: string,
    stop: string,
    separator: string,
    parser: (stream: LexicalStream) => string
  ) {
    let first = true;
    const args: string[] = [];
    this.skipPunctuation(start);
    while (this.stream.hasNext()) {
      if (this.isPunctuation(stop)) break;
      if (first) {
        first = false;
      } else {
        this.skipPunctuation(separator);
      }
      if (this.isPunctuation(stop)) break;
      args.push(parser(this.stream));
    }
    this.skipPunctuation(stop);
    return args;
  }

  static parseIdentifierName(stream: LexicalStream) {
    const token = stream.next();
    if (!token || token.type !== TokenType.Id) {
      throw new SyntaxError("Expected identifier");
    }
    return token.value;
  }

  // wrapper around parseAtom
  private parseExpression() {
    return this.maybeCall(() => this.maybeBinary(this.parseAtom(), 0));
  }

  private parseAtom(checkForCalls = true): any {
    const cb = () => {
      // needed for maybeBinary
      if (this.isPunctuation("(")) {
        this.skipPunctuation("(");
        const expr = this.parseExpression();
        this.skipPunctuation(")");
        return expr;
      }
      if (this.isKeyword("if")) return this.parseConditional();
      if (this.isKeyword("True") || this.isKeyword("False"))
        return this.parseBoolean();
      if (this.isKeyword("func")) {
        this.skipKeyword("func");
        return this.parseFunction();
      }
      if (this.isKeyword("return")) {
        this.skipKeyword("return");
        return this.parseReturn();
      }
      const token = this.stream.next();
      if (
        token &&
        (token.type == TokenType.Id ||
          token.type == TokenType.String ||
          token.type == TokenType.Float ||
          token.type == TokenType.Int)
      )
        return token;
      throw new SyntaxError(`Unexpected token ${token?.value}`);
    };
    return checkForCalls ? this.maybeCall(cb) : cb;
  }

  // maybe* functions are used to determine whether or not a certain parser should be called, for example a function call
  private maybeCall(predicate: () => any) {
    const expr = predicate();
    return this.isPunctuation("(") ? this.parseCall(expr) : expr;
  }

  /**
   * @param left left side of expression
   * @param precedence precedence of current operator
   * @returns complete binary node
   */
  private maybeBinary(left: object, precedence: number): object {
    const op = this.isOperation();
    // example 1: [0] 1 + [10] 2 * [20] 3
    // example 2: 2 * 3 + 4
    if (op) {
      const currentPrecedence =
        OP_PRECEDENCE[op.value as keyof typeof OP_PRECEDENCE];
      if (currentPrecedence > precedence) {
        this.stream.next();
        const right = this.maybeBinary(this.parseAtom(), currentPrecedence);
        const binary = {
          type: op.value == "=" ? "assign" : "binary",
          operator: op.value,
          left: left,
          right: right,
        };
        return this.maybeBinary(binary, precedence);
      }
    }
    return left;
  }

  private parseCall(func: string) {
    return {
      func,
      type: "call",
      args: this.parseByDelimiter("(", ")", ",", this.parseExpression),
    };
  }

  private parseFunction() {
    return {
      type: "function",
      name: ASTParsingStream.parseIdentifierName(this.stream),
      params: this.parseByDelimiter(
        "(",
        ")",
        ",",
        ASTParsingStream.parseIdentifierName
      ),
      body: this.parseExpressionOrBlock(),
    };
  }

  private parseBoolean() {
    return {
      type: "bool",
      value: this.stream.next()?.value === "True",
    };
  }

  private parseReturn() {
    return {
      type: "return",
      value: this.parseExpression(),
    };
  }

  private parseConditional() {
    this.skipKeyword("if");
    const condition = this.parseExpression();
    // could be newline or space
    // should parse blocks separately with parseBlock
    const then = this.parseExpressionOrBlock(["else", "elif"]);
    let node: Record<string, any> = { type: "if", condition, then };
    let finalAlternative = node;
    const checkForElif = (): any => {
      if (this.isKeyword("elif")) {
        this.skipKeyword("elif");
        const alternativeExpression = this.parseExpression();
        const alternativeThen = this.parseExpressionOrBlock(["else", "elif"]);
        const alternative = checkForElif();
        if (alternative) {
          finalAlternative = alternative;
          return {
            type: "if",
            condition: alternativeExpression,
            then: alternativeThen,
            alternative,
          };
        }
      }
      return null;
    };
    node.alternative = checkForElif();
    if (this.isKeyword("else")) {
      this.skipKeyword("else");
      const elseNode = this.parseExpressionOrBlock();
      finalAlternative.alternative = {
        type: "if",
        then: elseNode,
      };
    }
    return node;
  }
}
